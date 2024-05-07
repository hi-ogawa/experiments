import path from "node:path";
import {
	vitePluginLogger,
	vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import { defineConfig } from "vite";

export default defineConfig((env) => ({
	clearScreen: false,
	plugins: [
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
