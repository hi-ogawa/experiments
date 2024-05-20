import {
	vitePluginLogger,
	vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { vitePluginReactServer } from "./src/integrations/plugin";

export default defineConfig({
	clearScreen: false,
	plugins: [
		vitePluginLogger(),
		vitePluginSsrMiddleware({
			entry: "/src/adapters/node",
		}),
		vitePluginReactServer(),
		false && react(),
		false && TanStackRouterVite(),
	],
	optimizeDeps: {
		entries: [],
	},
});
