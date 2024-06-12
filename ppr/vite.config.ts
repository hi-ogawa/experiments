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
			entry: "/src/entry-server.tsx",
			preview: path.resolve("./dist/server/index.js"),
		}),
	],
	build: {
		outDir: env.isSsrBuild ? "dist/server" : "dist/client",
	},
}));
