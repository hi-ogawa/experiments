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
	reactRefresh?: boolean;
	ssrModuleRunner?: boolean;
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
							createEnvironment: RolldownEnvironment.createFactory({
								...viterollOptions,
								reactRefresh: false,
							}),
						},
					},
				},
			};
		},
		configureServer(server_) {
			server = server_;
			environments = server.environments as any;

			// rolldown assets middleware
			server.middlewares.use(async (_req, _res, next) => {
				try {
					await environments.client.buildPromise;
					next();
				} catch (e) {
					next(e);
				}
			});
			server.middlewares.use(
				sirv(environments.client.outDir, { dev: true, extensions: ["html"] }),
			);

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
	};
}

// reuse /@vite/client for Websocket API and inject to rolldown:runtime
function getRolldownClientCode(config: ResolvedConfig) {
	const viteClientPath = require.resolve("vite/dist/client/client.mjs");
	let code = fs.readFileSync(viteClientPath, "utf-8");
	const replacements = {
		// TODO: https://github.com/vitejs/vite/blob/55461b43329db6a5e737eab591163a8681ba9230/packages/vite/src/node/plugins/clientInjections.ts
		__BASE__: JSON.stringify(config.base),
		__SERVER_HOST__: `""`,
		__HMR_PROTOCOL__: `null`,
		__HMR_HOSTNAME__: `null`,
		__HMR_PORT__: `new URL(self.location.href).port`,
		__HMR_DIRECT_TARGET__: `""`,
		__HMR_BASE__: `"/"`,
		__HMR_TIMEOUT__: `30000`,
		__HMR_ENABLE_OVERLAY__: `true`,
		__HMR_CONFIG_NAME__: `""`,
		// runtime define is not necessary
		[`import '@vite/env';`]: ``,
		// remove esm code since this runs as classic script
		[`export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };`]: ``,
		"import.meta.url": "self.location.href",
	};
	for (const [k, v] of Object.entries(replacements)) {
		code = code.replaceAll(k, v);
	}
	// inject own hmr event handler
	code += `
const hot = createHotContext("/__rolldown");
hot.on("rolldown:hmr", (data) => {
	(0, eval)(data[1]);
});
window.__rolldown_hot = hot;
`;
	return `(() => {/*** @vite/client for rolldown ***/\n${code}}\n)()`;
}

export class RolldownEnvironment extends DevEnvironment {
	instance!: rolldown.RolldownBuild;
	result!: rolldown.RolldownOutput;
	outDir: string;
	inputOptions!: rolldown.InputOptions;
	outputOptions!: rolldown.OutputOptions;
	buildTimestamp = Date.now();
	lastModules: Record<string, string | null> = {};
	newModules: Record<string, string | null> = {};
	buildPromise?: Promise<void>;

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
		return (this.buildPromise = this.buildImpl());
	}

	async buildImpl() {
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
		this.inputOptions = {
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
				viterollEntryPlugin(this.config, this.viterollOptions, this),
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
				{
					name: "viteroll:extract-hmr-chunk",
					renderChunk: (_code, chunk) => {
						// cf. https://github.com/web-infra-dev/rspack/blob/5a967f7a10ec51171a304a1ce8d741bd09fa8ed5/crates/rspack_plugin_hmr/src/lib.rs#L60
						// TODO: assume single chunk for now
						this.newModules = {};
						const modules: Record<string, string | null> = {};
						for (const [id, mod] of Object.entries(chunk.modules)) {
							const current = mod.code;
							const last = this.lastModules?.[id];
							if (current !== last) {
								this.newModules[id] = current;
							}
							modules[id] = current;
						}
						this.lastModules = modules;
					},
				},
				...(plugins as any),
			],
		};
		this.instance = await rolldown.rolldown(this.inputOptions);

		const format: rolldown.ModuleFormat =
			this.name === "client" ||
			(this.name === "ssr" && this.viterollOptions.ssrModuleRunner)
				? "app"
				: "esm";
		this.outputOptions = {
			dir: this.outDir,
			format,
			// TODO: hmr_rebuild returns source map file when `sourcemap: true`
			sourcemap: "inline",
			// TODO: https://github.com/rolldown/rolldown/issues/2041
			// handle `require("stream")` in `react-dom/server`
			banner:
				this.name === "ssr" && format === "esm"
					? `import __nodeModule from "node:module"; const require = __nodeModule.createRequire(import.meta.url);`
					: undefined,
		};
		// `generate` should work but we use `write` so it's easier to see output and debug
		this.result = await this.instance.write(this.outputOptions);

		this.buildTimestamp = Date.now();
		console.timeEnd(`[rolldown:${this.name}:build]`);
	}

	async buildHmr(file: string) {
		logger.info(`hmr '${file}'`, { timestamp: true });
		await this.build();
		let stableIds: string[] = [];
		let innerCode = "";
		for (const [id, code] of Object.entries(this.newModules)) {
			const stableId = path.relative(this.config.root, id);
			stableIds.push(stableId);
			innerCode += `\
	rolldown_runtime.define(${JSON.stringify(stableId)},function(require, module, exports){
		${code}
	});
`;
		}
		const output = `\
self.rolldown_runtime.patch(${JSON.stringify(stableIds)}, function(){
${innerCode}
});
`;
		// dump for debugging
		const updatePath = path.join(this.outDir, `hmr-update-${Date.now()}.js`);
		fs.writeFileSync(updatePath, output);
		return [updatePath, output];
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
			if (this.outputOptions.format === "app") {
				const result = await this.buildHmr(ctx.file);
				this.getRunner().evaluate(result[1].toString(), result[0]);
			} else {
				await this.build();
			}
		} else {
			const result = await this.buildHmr(ctx.file);
			ctx.server.ws.send("rolldown:hmr", result);
		}
	}

	runner!: RolldownModuleRunner;

	getRunner() {
		if (!this.runner) {
			const output = this.result.output[0];
			const filepath = path.join(this.outDir, output.fileName);
			this.runner = new RolldownModuleRunner();
			const code = fs.readFileSync(filepath, "utf-8");
			this.runner.evaluate(code, filepath);
		}
		return this.runner;
	}

	async import(input: string): Promise<unknown> {
		if (this.outputOptions.format === "app") {
			return this.getRunner().import(input);
		}
		// input is no use
		const output = this.result.output[0];
		const filepath = path.join(this.outDir, output.fileName);
		// TODO: source map not applied when adding `?t=...`?
		// return import(`${pathToFileURL(filepath)}`)
		return import(`${pathToFileURL(filepath)}?t=${this.buildTimestamp}`);
	}
}

class RolldownModuleRunner {
	// intercept globals
	private context = {
		rolldown_runtime: {} as any,
		__rolldown_hot: {
			send: () => {},
		},
		// TODO
		// should be aware of importer for non static require/import.
		// they needs to be transformed beforehand, so runtime can intercept.
		require,
	};

	// TODO: support resolution?
	async import(id: string): Promise<unknown> {
		const mod = this.context.rolldown_runtime.moduleCache[id];
		assert(mod, `Module not found '${id}'`);
		return mod.exports;
	}

	evaluate(code: string, sourceURL: string) {
		const context = {
			self: this.context,
			...this.context,
		};
		// extract sourcemap
		const sourcemap = code.match(/^\/\/# sourceMappingURL=.*/m)?.[0] ?? "";
		if (sourcemap) {
			code = code.replace(sourcemap, "");
		}
		// as eval
		code = `\
'use strict';(${Object.keys(context).join(",")})=>{{${code}
// TODO: need to re-expose runtime utilities for now
self.__toCommonJS = __toCommonJS;
self.__export = __export;
self.__toESM = __toESM;
}}
//# sourceURL=${sourceURL}
${sourcemap}
`;
		try {
			const fn = (0, eval)(code);
			fn(...Object.values(context));
		} catch (e) {
			console.error(e);
		}
	}
}

// TODO: copy vite:build-html plugin
function viterollEntryPlugin(
	config: ResolvedConfig,
	viterollOptions: ViterollOptions,
	environment: RolldownEnvironment,
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

				// extract <script src="...">
				const matches = code.matchAll(
					/<script\b[^>]+\bsrc=["']([^"']+)["'][^>]*>.*?<\/script>/dg,
				);
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
			if (true) {
				const output = new MagicString(code);
				let runtimeCode = fs.readFileSync(
					path.join(import.meta.dirname, "viteroll-runtime.js"),
					"utf-8",
				);
				runtimeCode = runtimeCode
					.replace(
						"this.executeModuleStack.length > 1",
						"this.executeModuleStack.length >= 1",
					)
					.replace("parents: [parent],", "parents: parent ? [parent] : [],")
					.replace(
						"if (module.parents.indexOf(parent) === -1) {",
						"if (parent && module.parents.indexOf(parent) === -1) {",
					)
					.replace("if (item.deps.includes(updateModuleId)) {", "if (true) {")
					.replace(
						"var module = rolldown_runtime.moduleCache[moduleId];",
						"var module = rolldown_runtime.moduleCache[moduleId]; if (!module) { continue; }",
					)
					.replace(
						"for (var i = 0; i < module.parents.length; i++) {",
						`
						boundaries.push(moduleId);
						invalidModuleIds.push(moduleId);
						if (module.parents.filter(Boolean).length === 0) {
							globalThis.window?.location.reload();
							break;
						}
						for (var i = 0; i < module.parents.length; i++) {`,
					);
				output.prepend(runtimeCode);
				if (environment.name === "client") {
					output.prepend(getRolldownClientCode(config));
				}
				if (viterollOptions.reactRefresh) {
					output.prepend(getReactRefreshRuntimeCode());
				}
				return {
					code: output.toString(),
					map: output.generateMap({ hires: "boundary" }),
				};
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
				return [
					`const [$RefreshSig$, $RefreshReg$] = __react_refresh_transform_define(${JSON.stringify(id)})`,
					code,
					`__react_refresh_transform_setupHot(module.hot)`,
				].join(";");
			},
		},
	};
}

// inject react refresh runtime in client runtime to ensure initialized early
function getReactRefreshRuntimeCode() {
	let code = fs.readFileSync(
		path.resolve(
			require.resolve("react-refresh/runtime"),
			"..",
			"cjs/react-refresh-runtime.development.js",
		),
		"utf-8",
	);
	const output = new MagicString(code);
	output.prepend("self.__react_refresh_runtime = {};\n");
	output.replaceAll('process.env.NODE_ENV !== "production"', "true");
	output.replaceAll(/\bexports\./g, "__react_refresh_runtime.");
	output.append(`
		(() => {
			__react_refresh_runtime.injectIntoGlobalHook(self);

			__react_refresh_transform_define = (file) => [
				__react_refresh_runtime.createSignatureFunctionForTransform,
				(type, id) => __react_refresh_runtime.register(type, file + '_' + id)
			];

			__react_refresh_transform_setupHot = (hot) => {
				hot.accept((prev) => {
					debouncedRefresh();
				});
			};

			function debounce(fn, delay) {
				let handle
				return () => {
					clearTimeout(handle)
					handle = setTimeout(fn, delay)
				}
			}
			const debouncedRefresh = debounce(__react_refresh_runtime.performReactRefresh, 16);
		})()
	`);
	return output.toString();
}
