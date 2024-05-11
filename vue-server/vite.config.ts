import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import {
	vitePluginLogger,
	vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import vue from "@vitejs/plugin-vue";
import { type Plugin, type PluginOption, defineConfig } from "vite";

export default defineConfig((env) => ({
	clearScreen: false,
	plugins: [
		vitePluginVueServer(),
		vitePluginLogger(),
		vitePluginSsrMiddleware({
			entry: process.env["SERVER_ENTRY"] ?? "/src/demo/adapters/node",
			preview: path.resolve("dist/server/index.js"),
		}),
		{
			name: "global-vite-server",
			configureServer(server) {
				(globalThis as any).__vite_server = server;
			},
		},
	],
	build: {
		outDir: env.isSsrBuild ? "dist/server" : "dist/client",
		sourcemap: true,
		manifest: true,
		minify: false,
	},
}));

function vitePluginVueServer(): PluginOption {
	const clientIds = new Set<string>();
	const serverIds = new Set<string>();

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
			transform(code, id, _options) {
				if (id.endsWith(".server.vue")) {
					// remove import.meta.hot.accept from *.server.vue
					// https://github.com/vitejs/vite-plugin-vue/blob/46d0baa45c9e7cf4cd3ed773af5ba9f2a503b446/packages/plugin-vue/src/main.ts#L156
					code = code
						.replace(/.*__hmrId.*/, "")
						.replace(/.*__VUE_HMR_RUNTIME__.*/, "")
						.replace("import.meta.hot.accept", "(() => {})");
					return code;
				}
			},
		},
		{
			name: vitePluginVueServer.name + ":hmr",
			handleHotUpdate(ctx) {
				if (ctx.modules.every((m) => m.id && !clientIds.has(m.id))) {
					ctx.server.hot.send({
						type: "custom",
						event: "vue-server:update",
						data: {
							file: ctx.file,
						},
					});
					// server module/transform cache is already invalidated up to server entry,
					// so we simply return empty to avoid full-reload
					// https://github.com/vitejs/vite/blob/f71ba5b94a6e862460a96c7bf5e16d8ae66f9fe7/packages/vite/src/node/server/index.ts#L796-L798
					return [];
				}
			},
		},
		{
			// track which id is processed in which environment
			// by intercepting transform
			name: vitePluginLogger.name + ":track-environment",
			transform(_code, id, options) {
				if (options?.ssr) {
					serverIds.add(id);
				} else {
					clientIds.add(id);
				}
			},
		},
	];
}

function patchServerVue(plugin: Plugin): Plugin {
	tinyassert(typeof plugin.transform === "function");
	const oldTransform = plugin.transform;
	plugin.transform = async function (code, id, _options) {
		// need to force non-ssr transform to always render vnode
		return oldTransform.apply(this, [code, id, { ssr: false }]);
	};

	// also remove handleHotUpdate and handle server component hmr on our own
	tinyassert(typeof plugin.handleHotUpdate === "function");
	delete plugin.handleHotUpdate;

	return plugin;
}
