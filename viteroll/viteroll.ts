import assert from "node:assert";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import MagicString from "magic-string";
import * as rolldown from "rolldown";
import * as rolldownExperimental from "rolldown/experimental";
import sirv from "sirv";
import {
	DevEnvironment,
	type DevEnvironmentOptions,
	type HmrContext,
	type Plugin,
	type PluginOption,
	type ResolvedConfig,
	type ViteDevServer,
	createLogger,
	loadConfigFromFile,
} from "vite";

const require = createRequire(import.meta.url);

interface ViterollOptions {
	hmr?: boolean;
	reactRefresh?: boolean;
}

const logger = createLogger("info", {
	prefix: "[rolldown]",
	allowClearScreen: false,
});

export function viteroll(viterollOptions: ViterollOptions = {}): Plugin {
	let server: ViteDevServer;
	let environments: Record<"client" | "ssr", RolldownEnvironment>;

	return {
		name: viteroll.name,
		config(config) {
			return {
				appType: "custom",
				optimizeDeps: {
					noDiscovery: true,
				},
				define: {
					// TODO: copy vite:define plugin
					"process.env.NODE_ENV": "'development'",
				},
				environments: {
					client: {
						dev: {
							createEnvironment:
								RolldownEnvironment.createFactory(viterollOptions),
						},
						build: {
							rollupOptions: {
								input:
									config.build?.rollupOptions?.input ??
									config.environments?.client.build?.rollupOptions?.input ??
									"./index.html",
							},
						},
					},
					ssr: {
						dev: {
							createEnvironment:
								RolldownEnvironment.createFactory(viterollOptions),
						},
					},
				},
			};
		},
		configureServer(server_) {
			server = server_;
			environments = server.environments as any;

			// rolldown server as middleware
			server.middlewares.use(
				sirv(environments.client.outDir, { dev: true, extensions: ["html"] }),
			);

			// full build on non self accepting entry
			server.ws.on("rolldown:hmr-deadend", async (data) => {
				logger.info(`hmr-deadend '${data.moduleId}'`, { timestamp: true });
				await environments.client.build();
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
		async handleHotUpdate(ctx) {
			await environments.ssr.handleUpdate(ctx);
			await environments.client.handleUpdate(ctx);
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

export class RolldownEnvironment extends DevEnvironment {
	instance!: rolldown.RolldownBuild;
	result!: rolldown.RolldownOutput;
	outDir!: string;
	buildTimestamp = Date.now();

	static createFactory(
		viterollOptions: ViterollOptions,
	): NonNullable<DevEnvironmentOptions["createEnvironment"]> {
		return (name, config) =>
			new RolldownEnvironment(viterollOptions, name, config);
	}

	constructor(
		public viterollOptions: ViterollOptions,
		name: ConstructorParameters<typeof DevEnvironment>[0],
		config: ConstructorParameters<typeof DevEnvironment>[1],
	) {
		super(name, config, { hot: false });
		this.outDir = path.join(this.config.root, this.config.build.outDir);
	}

	override async init() {
		await super.init();
		await this.build();
	}

	override async close() {
		await this.instance?.close();
	}

	async build() {
		if (!this.config.build.rollupOptions.input) {
			return;
		}

		await this.instance?.close();

		if (this.config.build.emptyOutDir !== false) {
			fs.rmSync(this.outDir, { recursive: true, force: true });
		}

		// load fresh user plugins as rolldown plugins
		let plugins: PluginOption[] = [];
		if (this.config.configFile) {
			const loaded = await loadConfigFromFile(
				{ command: "serve", mode: "development" },
				this.config.configFile,
				this.config.root,
			);
			assert(loaded);
			plugins =
				loaded.config.plugins?.filter(
					(v) => v && "name" in v && v.name !== viteroll.name,
				) ?? [];
		}

		console.time(`[rolldown:${this.name}:build]`);
		const inputOptions: rolldown.InputOptions = {
			// TODO: no dev ssr for now
			dev: this.name === "client",
			// NOTE:
			// we'll need input options during dev too though this sounds very much reasonable.
			// eventually `build.rollupOptions` should probably come forefront.
			// https://vite.dev/guide/build.html#multi-page-app
			input: this.config.build.rollupOptions.input,
			cwd: this.config.root,
			platform: this.name === "client" ? "browser" : "node",
			resolve: {
				conditionNames: this.config.resolve.conditions,
				mainFields: this.config.resolve.mainFields,
				symlinks: !this.config.resolve.preserveSymlinks,
			},
			define: this.config.define,
			plugins: [
				viterollEntryPlugin(this.config, this.viterollOptions),
				// TODO: how to use jsx-dev-runtime?
				rolldownExperimental.transformPlugin({
					reactRefresh:
						this.name === "client" && this.viterollOptions?.reactRefresh,
				}),
				this.name === "client" && this.viterollOptions?.reactRefresh
					? reactRefreshPlugin()
					: [],
				rolldownExperimental.aliasPlugin({
					entries: this.config.resolve.alias,
				}),
				...(plugins as any),
			],
		};
		this.instance = await rolldown.rolldown(inputOptions);

		// `generate` should work but we use `write` so it's easier to see output and debug
		const outputOptions: rolldown.OutputOptions = {
			dir: this.outDir,
			format: this.name === "client" ? "app" : "es",
			// TODO: hmr_rebuild returns source map file when `sourcemap: true`
			sourcemap: "inline",
		};
		this.result = await this.instance.write(outputOptions);

		this.buildTimestamp = Date.now();
		console.timeEnd(`[rolldown:${this.name}:build]`);
	}

	async handleUpdate(ctx: HmrContext) {
		if (!this.result) {
			return;
		}
		const output = this.result.output[0];
		if (!output.moduleIds.includes(ctx.file)) {
			return;
		}
		if (this.name === "ssr") {
			await this.build();
		} else {
			logger.info(`hmr '${ctx.file}'`, { timestamp: true });
			console.time(`[rolldown:${this.name}:hmr]`);
			const result = await this.instance.experimental_hmr_rebuild([ctx.file]);
			console.timeEnd(`[rolldown:${this.name}:hmr]`);
			ctx.server.ws.send("rolldown:hmr", result);
		}
		return true;
	}

	async import(input: string): Promise<unknown> {
		const output = this.result.output.find((o) => o.name === input);
		assert(output, `invalid import input '${input}'`);
		const filepath = path.join(this.outDir, output.fileName);
		return import(`${pathToFileURL(filepath)}?t=${this.buildTimestamp}`);
	}
}

// TODO: copy vite:build-html plugin
function viterollEntryPlugin(
	config: ResolvedConfig,
	viterollOptions: ViterollOptions,
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
