import assert from "node:assert";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import MagicString from "magic-string";
import * as rolldown from "rolldown";
import * as rolldownExperimental from "rolldown/experimental";
import sirv from "sirv";
import {
	type Plugin,
	type PluginOption,
	type ResolvedConfig,
	type ViteDevServer,
	createLogger,
	loadConfigFromFile,
} from "vite";

const require = createRequire(import.meta.url);

export function viteroll(viterollOptions?: {
	reactRefresh?: boolean;
}): Plugin {
	let rolldownBuild: rolldown.RolldownBuild;
	let rolldownOutput: rolldown.RolldownOutput;
	let server: ViteDevServer;
	let config: ResolvedConfig;
	let outDir: string;

	const logger = createLogger("info", {
		prefix: "[rolldown]",
		allowClearScreen: false,
	});

	// TODO: abstract to support build per environment
	async function fullBuild() {
		if (rolldownBuild) {
			await rolldownBuild?.close();
		}

		// load fresh user plugins as rolldown plugins
		let plugins: PluginOption[] = [];
		if (config.configFile) {
			const loaded = await loadConfigFromFile(
				{ command: "serve", mode: "development" },
				config.configFile,
				config.root,
			);
			assert(loaded);
			plugins =
				loaded.config.plugins?.filter(
					(v) => v && "name" in v && v.name !== viteroll.name,
				) ?? [];
		}

		console.time("[rolldown:build]");
		rolldownBuild = await rolldown.rolldown({
			dev: true,
			// NOTE:
			// we'll need input options during dev too though this sounds very much reasonable.
			// eventually `build.rollupOptions` should probably come forefront.
			// https://vite.dev/guide/build.html#multi-page-app
			input:
				config.environments.client.build.rollupOptions.input ?? "./index.html",
			cwd: config.root,
			platform: "browser",
			resolve: {
				conditionNames: config.resolve.conditions,
				mainFields: config.resolve.mainFields,
				symlinks: !config.resolve.preserveSymlinks,
			},
			define: config.define,
			plugins: [
				viterollEntryPlugin(config, viterollOptions),
				// TODO: how to use jsx-dev-runtime?
				rolldownExperimental.transformPlugin({
					reactRefresh: viterollOptions?.reactRefresh,
				}),
				viterollOptions?.reactRefresh ? reactRefreshPlugin() : [],
				rolldownExperimental.aliasPlugin({
					entries: config.resolve.alias,
				}),
				...(plugins as any),
			],
		});

		// `generate` should work but we use `write` so it's easier to see output and debug
		rolldownOutput = await rolldownBuild.write({
			dir: config.build.outDir,
			format: "app",
			// TODO: hmr_rebuild returns source map file when `sourcemap: true`
			sourcemap: "inline",
		});
		console.timeEnd("[rolldown:build]");
	}

	return {
		name: viteroll.name,
		config() {
			return {
				appType: "custom",
				optimizeDeps: {
					noDiscovery: true,
				},
				define: {
					// TODO: copy vite:define plugin
					"process.env.NODE_ENV": "'development'",
				},
			};
		},
		configResolved(config_) {
			config = config_;
			outDir = path.resolve(config.root, config.build.outDir);
		},
		configureServer(server_) {
			server = server_;

			// rolldown server as middleware
			server.middlewares.use(sirv(outDir, { dev: true, extensions: ["html"] }));

			// full build on non self accepting entry
			server.ws.on("rolldown:hmr-deadend", async (data) => {
				logger.info(`hmr-deadend '${data.moduleId}'`, { timestamp: true });
				await fullBuild();
				server.ws.send({ type: "full-reload" });
			});

			// disable automatic html reload
			// https://github.com/vitejs/vite/blob/01cf7e14ca63988c05627907e72b57002ffcb8d5/packages/vite/src/node/server/hmr.ts#L590-L595
			const oldSend = server.ws.send;
			server.ws.send = function (...args: any) {
				const arg = args[0];
				if (
					arg &&
					typeof arg === "object" &&
					arg.type === "full-reload" &&
					typeof arg.path === "string" &&
					arg.path.endsWith(".html")
				) {
					return;
				}
				oldSend.apply(this, args);
			};
		},
		async buildStart() {
			if (config.build.emptyOutDir) {
				fs.rmSync(outDir, { recursive: true, force: true });
			}
			await fullBuild();
		},
		async buildEnd() {
			await rolldownBuild.close();
		},
		async handleHotUpdate(ctx) {
			const output = rolldownOutput.output[0];
			if (output.moduleIds.includes(ctx.file)) {
				logger.info(`hmr '${ctx.file}'`, { timestamp: true });
				console.time("[rolldown:hmr]");
				const result = await rolldownBuild.experimental_hmr_rebuild([ctx.file]);
				console.timeEnd("[rolldown:hmr]");
				server.ws.send("rolldown:hmr", result);
				return [];
			}
		},
		transform(code, id) {
			// remove unnecessary /@vite/env
			if (id.endsWith("/vite/dist/client/client.mjs")) {
				code = code.replace(`import '@vite/env'`, "/* @vite/env removed */");
				return { code, map: null };
			}
		},
	};
}

// TODO: similar to vite:build-html plugin?
function viterollEntryPlugin(
	config: ResolvedConfig,
	viterollOptions?: {
		reactRefresh?: boolean;
	},
): rolldown.Plugin {
	const htmlEntryMap = new Map<string, MagicString>();

	return {
		name: "viteroll:entry",
		transform: {
			filter: {
				id: {
					include: [/\.html$/],
				},
			},
			async handler(code, id) {
				// process html (will be emiited later during generateBundle)
				const htmlOutput = new MagicString(code);
				htmlEntryMap.set(id, htmlOutput);

				let jsOutput = ``;
				if (viterollOptions?.reactRefresh) {
					jsOutput += `import "virtual:react-refresh/entry";\n`;
				}

				// extract <script src="...">
				const matches = code.matchAll(/<script\s+src="([^"]+)"><\/script>/dg);
				for (const match of matches) {
					const src = match[1];
					const resolved = await this.resolve(src, id);
					if (!resolved) {
						this.warn(`unresolved src '${src}' in '${id}'`);
						continue;
					}
					jsOutput += `import ${JSON.stringify(resolved.id)};\n`;
					const [start, end] = match.indices![0];
					htmlOutput.remove(start, end);
				}

				// emit js entry
				return {
					code: jsOutput,
					moduleSideEffects: "no-treeshake",
				};
			},
		},
		renderChunk(code) {
			// patch rolldown_runtime to workaround a few things
			if (code.includes("//#region rolldown:runtime")) {
				const output = new MagicString(code);
				// patch out hard-coded WebSocket setup "const socket = WebSocket(`ws://localhost:8080`)"
				output.replace(/const socket =.*?\n};/s, "");
				// trigger full rebuild on non-accepting entry invalidation
				output
					.replace("parents: [parent],", "parents: parent ? [parent] : [],")
					.replace(
						"for (var i = 0; i < module.parents.length; i++) {",
						`
						if (module.parents.length === 0) {
							__rolldown_hot.send("rolldown:hmr-deadend", { moduleId });
							break;
						}
						for (var i = 0; i < module.parents.length; i++) {`,
					);
				return { code: output.toString(), map: output.generateMap() };
			}
		},
		generateBundle(_options, bundle) {
			for (const key in bundle) {
				const chunk = bundle[key];
				// emit final html
				if (chunk.type === "chunk" && chunk.facadeModuleId) {
					const htmlId = chunk.facadeModuleId;
					const htmlOutput = htmlEntryMap.get(htmlId);
					if (htmlOutput) {
						// inject js entry
						htmlOutput.appendLeft(
							htmlOutput.original.indexOf(`</body>`),
							`<script src="/${chunk.fileName}"></script>`,
						);

						// inject client
						// (reuse /@vite/client for Websocket API)
						htmlOutput.appendLeft(
							htmlOutput.original.indexOf(`</head>`),
							`
							<script type="module">
								import { createHotContext } from "/@vite/client";
								const hot = createHotContext("/__rolldown");
								hot.on("rolldown:hmr", (data) => {
									(0, eval)(data[1]);
								});
								window.__rolldown_hot = hot;
							</script>
							`,
						);

						this.emitFile({
							type: "asset",
							fileName: path.relative(config.root, htmlId),
							originalFileName: htmlId,
							source: htmlOutput.toString(),
						});
					}
				}
			}
		},
	};
}

// TODO: workaround rolldownExperimental.reactPlugin which injects js to html via `load` hook
function reactRefreshPlugin(): rolldown.Plugin {
	return {
		name: "react-hmr",
		transform: {
			filter: {
				code: {
					include: ["$RefreshReg$"],
				},
			},
			handler(code, id) {
				const output = new MagicString(code);
				output.prepend(`
					import * as __$refresh from 'virtual:react-refresh';
					const [$RefreshSig$, $RefreshReg$] = __$refresh.create(${JSON.stringify(id)});
				`);
				output.append(`
					__$refresh.setupHot(module.hot);
				`);
				return { code: output.toString(), map: output.generateMap() };
			},
		},
		resolveId: {
			filter: {
				id: {
					include: [/^virtual:react-refresh/],
				},
			},
			handler: (source) => "\0" + source,
		},
		load: {
			filter: {
				id: {
					include: [/^\0virtual:react-refresh/],
				},
			},
			async handler(id) {
				const resolved = require.resolve("react-refresh/runtime");
				if (id === "\0virtual:react-refresh/entry") {
					return `
						import runtime from ${JSON.stringify(resolved)};
						runtime.injectIntoGlobalHook(window);
					`;
				}
				if (id === "\0virtual:react-refresh") {
					return `
						import runtime from ${JSON.stringify(resolved)};

						export const create = (file) => [
							runtime.createSignatureFunctionForTransform,
							(type, id) => runtime.register(type, file + '_' + id),
						];

						function debounce(fn, delay) {
							let handle
							return () => {
								clearTimeout(handle)
								handle = setTimeout(fn, delay)
							}
						}
						const debouncedRefresh = debounce(runtime.performReactRefresh, 16);

						export function setupHot(hot) {
							hot.accept((prev) => {
								debouncedRefresh();
							});
						}
					`;
				}
			},
		},
	};
}
