import assert from "node:assert";
import path from "node:path";
import react from "@vitejs/plugin-react";
import {
	type Manifest,
	type Plugin,
	type RunnableDevEnvironment,
	createRunnableDevEnvironment,
	defineConfig,
} from "vite";

let browserManifest: Manifest;
let clientReferences: Record<string, string> = {};
let serverReferences: Record<string, string> = {};
let buildScan = false;

export default defineConfig({
	appType: "custom",
	environments: {
		client: {
			build: {
				manifest: true,
				outDir: "dist/client",
				rollupOptions: {
					input: { index: "virtual:browser-entry" },
				},
			},
		},
		ssr: {
			build: {
				outDir: "dist/ssr",
				rollupOptions: {
					input: { index: "/src/entry.ssr.tsx" },
				},
			},
		},
		rsc: {
			optimizeDeps: {
				include: [
					"react",
					"react/jsx-runtime",
					"react/jsx-dev-runtime",
					"@jacob-ebey/react-server-dom-vite/server",
				],
			},
			resolve: {
				conditions: ["react-server"],
				noExternal: true,
			},
			dev: {
				createEnvironment(name, config) {
					return createRunnableDevEnvironment(name, config, { hot: false });
				},
			},
			build: {
				outDir: "dist/rsc",
				rollupOptions: {
					input: { index: "/src/entry.rsc.tsx" },
				},
			},
		},
	},
	plugins: [
		{
			name: "ssr-middleware",
			configureServer(server) {
				const ssrRunner = (server.environments.ssr as RunnableDevEnvironment)
					.runner;
				const rscRunner = (server.environments.rsc as RunnableDevEnvironment)
					.runner;
				Object.assign(globalThis, { __rscRunner: rscRunner });
				return () => {
					server.middlewares.use(async (req, res, next) => {
						try {
							const mod: any = await ssrRunner.import("/src/entry.ssr.tsx");
							await mod.default(req, res);
						} catch (e) {
							next(e);
						}
					});
				};
			},
			async configurePreviewServer(server) {
				const mod = await import(path.resolve("dist/ssr/index.js"));
				return () => {
					server.middlewares.use(async (req, res, next) => {
						try {
							await mod.default(req, res);
						} catch (e) {
							next(e);
						}
					});
				};
			},
		},
		{
			name: "virtual:build-rsc-entry",
			resolveId(source) {
				if (source === "virtual:build-rsc-entry") {
					// externalize rsc entry in ssr entry as relative path
					return { id: "../rsc/index.js", external: true };
				}
			},
		},
		createVirtualPlugin("ssr-assets", function () {
			assert(this.environment.name === "ssr");
			let bootstrapModules: string[] = [];
			if (this.environment.mode === "dev") {
				bootstrapModules = ["/@id/__x00__virtual:browser-entry"];
			}
			if (this.environment.mode === "build") {
				bootstrapModules = [browserManifest["virtual:browser-entry"].file];
			}
			return `export const bootstrapModules = ${JSON.stringify(bootstrapModules)}`;
		}),
		createVirtualPlugin("browser-entry", function () {
			if (this.environment.mode === "dev") {
				return `
					import "/@vite/client";
					import RefreshRuntime from "/@react-refresh";
					RefreshRuntime.injectIntoGlobalHook(window);
					window.$RefreshReg$ = () => {};
					window.$RefreshSig$ = () => (type) => type;
					window.__vite_plugin_react_preamble_installed__ = true;
					await import("/src/entry.client.tsx");
				`;
			} else {
				return `import "/src/entry.client.tsx";`;
			}
		}),
		{
			name: "misc",
			writeBundle(_options, bundle) {
				if (this.environment.name === "client") {
					const output = bundle[".vite/manifest.json"];
					assert(output.type === "asset");
					assert(typeof output.source === "string");
					browserManifest = JSON.parse(output.source);
				}
			},
		},
		vitePluginUseClient(),
		vitePluginUseServer(),
		vitePluginSilenceDirectiveBuildWarning(),
		react(),
	],
	builder: {
		sharedPlugins: true,
		sharedConfigBuild: true,
		async buildApp(builder) {
			buildScan = true;
			await builder.build(builder.environments.rsc);
			buildScan = false;
			await builder.build(builder.environments.rsc);
			await builder.build(builder.environments.client);
			await builder.build(builder.environments.ssr);
		},
	},
});

function vitePluginUseClient(): Plugin[] {
	return [
		{
			name: vitePluginUseClient.name,
			transform(code, id) {
				if (this.environment.name === "rsc") {
					if (/^(("use client")|('use client'))/.test(code)) {
						// pass through client code to find server reference used only by client
						if (buildScan) {
							return;
						}
						clientReferences[id] = id; // TODO: normalize
						const matches = code.matchAll(/export function (\w+)\(/g);
						const result = [
							`import $$ReactServer from "@jacob-ebey/react-server-dom-vite/server"`,
							...[...matches].map(
								([, name]) =>
									`export const ${name} = $$ReactServer.registerClientReference({}, ${JSON.stringify(id)}, ${JSON.stringify(name)})`,
							),
						].join(";\n");
						return { code: result, map: null };
					}
				}
			},
		},
		createVirtualPlugin("build-client-references", () => {
			const code = Object.keys(clientReferences)
				.map(
					(id) => `${JSON.stringify(id)}: () => import(${JSON.stringify(id)}),`,
				)
				.join("\n");
			return `export default {${code}}`;
		}),
	];
}

function vitePluginUseServer(): Plugin[] {
	return [
		{
			name: vitePluginUseServer.name,
			transform(code, id) {
				if (/^(("use server")|('use server'))/.test(code)) {
					if (this.environment.name === "rsc") {
						serverReferences[id] = id;
						const matches = code.matchAll(/export async function (\w+)\(/g);
						const result = [
							code,
							`import $$ReactServer from "@jacob-ebey/react-server-dom-vite/server"`,
							...[...matches].map(
								([, name]) =>
									`${name} = $$ReactServer.registerServerReference(${name}, ${JSON.stringify(id)}, ${JSON.stringify(name)})`,
							),
						].join(";\n");
						return { code: result, map: null };
					} else {
						// TODO
					}
				}
			},
		},
		createVirtualPlugin("build-server-references", () => {
			const code = Object.keys(serverReferences)
				.map(
					(id) => `${JSON.stringify(id)}: () => import(${JSON.stringify(id)}),`,
				)
				.join("\n");
			return `export default {${code}}`;
		}),
	];
}

function createVirtualPlugin(name: string, load: Plugin["load"]) {
	name = "virtual:" + name;
	return {
		name: `virtual-${name}`,
		resolveId(source, _importer, _options) {
			return source === name ? "\0" + name : undefined;
		},
		load(id, options) {
			if (id === "\0" + name) {
				return (load as Function).apply(this, [id, options]);
			}
		},
	} satisfies Plugin;
}

// silence warning due to "use ..." directives
// https://github.com/vitejs/vite-plugin-react/blob/814ed8043d321f4b4679a9f4a781d1ed14f185e4/packages/plugin-react/src/index.ts#L303
function vitePluginSilenceDirectiveBuildWarning(): Plugin {
	return {
		name: vitePluginSilenceDirectiveBuildWarning.name,
		enforce: "post",
		config(config, _env) {
			return {
				build: {
					rollupOptions: {
						onwarn(warning, defaultHandler) {
							// https://github.com/vitejs/vite/issues/15012#issuecomment-1948550039
							if (
								warning.code === "SOURCEMAP_ERROR" &&
								warning.message.includes("(1:0)")
							) {
								return;
							}
							// https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
							if (
								warning.code === "MODULE_LEVEL_DIRECTIVE" &&
								(warning.message.includes(`use client`) ||
									warning.message.includes(`use server`))
							) {
								return;
							}
							if (config.build?.rollupOptions?.onwarn) {
								config.build.rollupOptions.onwarn(warning, defaultHandler);
							} else {
								defaultHandler(warning);
							}
						},
					},
				},
			};
		},
	};
}
