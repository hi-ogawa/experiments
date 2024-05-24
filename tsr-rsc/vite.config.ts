import { resolve } from "path";
import {
	vitePluginLogger,
	vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { vitePluginReactServer } from "./src/integrations/plugin";

export default defineConfig({
	clearScreen: false,
	plugins: [
		vitePluginLogger(),
		vitePluginSsrMiddleware({
			entry: process.env["SERVER_ENTRY"] || "/src/adapters/node",
			preview: resolve("dist/ssr/index.js"),
		}),
		vitePluginReactServer(),
		false && react(),
	],
	optimizeDeps: {
		entries: [],
	},
	build: {
		minify: false,
	},
});
