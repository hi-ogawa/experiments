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
	return [
		// non server (i.e. browser and ssr)
		vue({
			exclude: ["**/*.server.vue"],
		}),
		// server
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
	];
}

// force non-ssr transform to always render vnode
function patchServerVue(plugin: Plugin): Plugin {
	tinyassert(typeof plugin.transform === "function");
	const oldTransform = plugin.transform;
	plugin.transform = function (code, id, _options) {
		return oldTransform.apply(this, [code, id]);
	};

	// also remove handleHotUpdate
	// otherwise we get `TypeError: true is not a function` somewhere...
	tinyassert(typeof plugin.handleHotUpdate === "function");
	delete plugin.handleHotUpdate;

	return plugin;
}
