import fs from "node:fs";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import {
	vitePluginLogger,
	vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import vue from "@vitejs/plugin-vue";
import {
	type ConfigEnv,
	type Plugin,
	type PluginOption,
	type ViteDevServer,
	build,
	defineConfig,
	parseAstAsync,
} from "vite";
import vitPluginInspect from "vite-plugin-inspect";

export default defineConfig((env) => ({
	clearScreen: false,
	plugins: [
		!!process.env["VITE_INSPECT"] && vitPluginInspect(),
		vitePluginVueServer(),
		vitePluginLogger(),
		vitePluginSsrMiddleware({
			entry: process.env["SERVER_ENTRY"] ?? "/src/demo/adapters/node",
			preview: path.resolve("dist/server/index.js"),
		}),
	],
	optimizeDeps: {
		entries: ["./src/demo/routes/**/(page|layout).*"],
		// TODO: why does scan miss this?
		include: ["vue/jsx-dev-runtime"],
	},
	build: {
		outDir: env.isSsrBuild ? "dist/server" : "dist/client",
		sourcemap: true,
		manifest: true,
		minify: false,
	},
}));

function vitePluginVueServer(): PluginOption {
	const browserIds = new Set<string>();

	return [
		// client sfc (i.e. browser and ssr)
		vue({
			exclude: ["**/*.server.vue"],
		}),
		// server sfc
		patchServerVue(
			vue({
				include: ["**/*.server.vue"],
			}),
		),
		{
			name: "patch-vue-server-hot",
			apply: "serve",
			transform(code, id, _options) {
				if (id.endsWith(".server.vue")) {
					// remove import.meta.hot.accept from *.server.vue
					// https://github.com/vitejs/vite-plugin-vue/blob/46d0baa45c9e7cf4cd3ed773af5ba9f2a503b446/packages/plugin-vue/src/main.ts#L156
					code = code
						.replace(/.*__hmrId.*/, "")
						.replace(/.*__VUE_HMR_RUNTIME__.*/, "")
						.replace("import.meta.hot.accept", "(() => {})");
					return { code, map: null };
				}
			},
		},
		{
			name: vitePluginVueServer.name + ":hmr",
			apply: "serve",
			transform(_code, id, options) {
				// track which id is processed in which environment
				// by intercepting transform
				if (!options?.ssr) {
					browserIds.add(id);
				}
			},
			handleHotUpdate(ctx) {
				if (
					ctx.modules.length > 0 &&
					ctx.modules.every((m) => m.id && !browserIds.has(m.id))
				) {
					console.log(`[vue-server] update ${ctx.file}`);
					ctx.server.hot.send({
						type: "custom",
						event: "vue-server:update",
						data: {
							file: ctx.file,
						},
					});
					// server module/transform cache is already invalidated up to server entry,
					// so we simply return empty to avoid full-reload
					// TODO: on Vite 6 environment api, we either need to manually invalidateTree
					//       on module runner or we actually don't need to do anything since
					//       server module update doesn't cause browser full-reload.
					// https://github.com/vitejs/vite/blob/f71ba5b94a6e862460a96c7bf5e16d8ae66f9fe7/packages/vite/src/node/server/index.ts#L796-L798
					return [];
				}
			},
		},
		clientReferencePlugin(),
	];
}

class PluginManager {
	env!: ConfigEnv;
	server?: ViteDevServer;
	// "server-pre" build to collect client boundaries
	// before actual client / server build
	buildType?: "server-pre" | "client" | "server";
}

const manager: PluginManager = ((
	globalThis as any
).__VUE_SERVER_BUILD_MANAGER ??= new PluginManager());

function clientReferencePlugin(): PluginOption {
	const clientBoundaryIds = new Set<string>();

	return [
		{
			name: clientReferencePlugin.name + ":manager",
			config(_config, env) {
				manager.env = env;
			},
			configureServer(server) {
				manager.server = server;
			},
			async buildStart(_options) {
				if (manager.env.command === "build" && !manager.env.isSsrBuild) {
					manager.buildType = "server-pre";
					await build({
						build: {
							ssr: true,
							outDir: "dist/server-pre",
						},
					});
					manager.buildType = "client";
				}
			},
		},
		{
			name: clientReferencePlugin.name + ":register-client-reference",
			async transform(code, id, options) {
				if (options?.ssr) {
					let nameMap: [string, string][];
					if (/^("use client"|'use client')/.test(code)) {
						const result = await parseExports(code);
						nameMap = [...result.exportNames].map((name) => [name, name]);
					} else if (
						// vue ssr transform means "client" component (i.e. ".vue" without ".server.vue")
						id.endsWith(".vue") &&
						/__vite_useSSRContext/.test(code)
					) {
						// it's difficult to handle `export default _export_sfc(_sfc_main, ...)`
						// so for now we directly mutate `_sfc_main` as client reference.
						nameMap = [["_sfc_main", "default"]];
					} else {
						return;
					}
					clientBoundaryIds.add(id);
					const outCode = [
						code,
						`import { registerClientReference as $$register } from "/src/serialize";`,
						...nameMap.map(
							([name, exportName]) =>
								`$$register(${name}, "${id}#${exportName}");`,
						),
					].join("\n");
					return { code: outCode, map: null };
				}
				return;
			},
			buildEnd() {
				if (manager.buildType === "server-pre") {
					const code = [
						"export default {",
						...[...clientBoundaryIds].map(
							(id) => `"${id}": () => import("${id}"),`,
						),
						"}",
					].join("\n");
					this.emitFile({
						type: "prebuilt-chunk",
						fileName: "client-references.mjs",
						code,
					});
				}
			},
		},
		createVirtualPlugin("client-references", async () => {
			if (manager.buildType === "server-pre") {
				return "/*** pre build ***/";
			}
			const code = await fs.promises.readFile(
				"dist/pre/client-references.mjs",
				"utf-8",
			);
			return { code, map: null };
		}),
		createVirtualPlugin("index-html", async function () {
			if (manager.buildType === "server-pre") {
				return "/*** pre build ***/";
			}
			let code: string;
			if (manager.server) {
				this.addWatchFile("index.html");
				code = await fs.promises.readFile("index.html", "utf-8");
				code = await manager.server.transformIndexHtml("/", code);
			} else {
				code = await fs.promises.readFile("dist/client/index.html", "utf-8");
			}
			return { code: `export default ${JSON.stringify(code)}`, map: null };
		}),
		vitePluginSilenceDirectiveBuildWarning(),
	];
}

function patchServerVue(plugin: Plugin): Plugin {
	// need to force non-ssr transform to always render vnode
	tinyassert(typeof plugin.transform === "function");
	const oldTransform = plugin.transform;
	plugin.transform = async function (code, id, _options) {
		return oldTransform.apply(this, [code, id, { ssr: false }]);
	};
	tinyassert(typeof plugin.load === "function");
	const oldLoad = plugin.load;
	plugin.load = async function (id, _options) {
		return oldLoad.apply(this, [id, { ssr: false }]);
	};

	// also remove handleHotUpdate since we handle server component hmr on our own
	tinyassert(typeof plugin.handleHotUpdate === "function");
	delete plugin.handleHotUpdate;

	return plugin;
}

async function parseExports(code: string) {
	// for now, support simple named exports
	// (sfc default export is handled separately above)
	const ast = await parseAstAsync(code);
	const exportNames = new Set<string>();
	for (const node of ast.body) {
		// named exports
		if (node.type === "ExportNamedDeclaration") {
			if (node.declaration) {
				if (
					node.declaration.type === "FunctionDeclaration" ||
					node.declaration.type === "ClassDeclaration"
				) {
					/**
					 * export function foo() {}
					 */
					exportNames.add(node.declaration.id.name);
				} else if (node.declaration.type === "VariableDeclaration") {
					/**
					 * export const foo = 1, bar = 2
					 */
					for (const decl of node.declaration.declarations) {
						if (decl.id.type === "Identifier") {
							exportNames.add(decl.id.name);
						}
					}
				}
			}
		}
	}
	return {
		exportNames,
	};
}

function createVirtualPlugin(name: string, load: Plugin["load"]) {
	name = "virtual:" + name;
	return {
		name,
		resolveId(source, _importer, _options) {
			if (source === name || source.startsWith(`${name}?`)) {
				return `\0${source}`;
			}
			return;
		},
		load(id, options) {
			if (id === `\0${name}` || id.startsWith(`\0${name}?`)) {
				return (load as any).apply(this, [id, options]);
			}
		},
	} satisfies Plugin;
}

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
								warning.loc?.line === 1 &&
								warning.loc.column === 0
							) {
								return;
							}
							// https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
							if (
								(warning.code === "MODULE_LEVEL_DIRECTIVE" &&
									warning.message.includes(`"use client"`)) ||
								warning.message.includes(`"use server"`)
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
