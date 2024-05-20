import { type Plugin, type PluginOption, createServer } from "vite";
import { $__global } from "./global";

export function vitePluginReactServer(): PluginOption {
	const mainPlugin: Plugin = {
		name: vitePluginReactServer.name,
		async buildStart() {
			$__global.reactServer = await createServer({
				configFile: false,
				cacheDir: "node_modules/.vite-react-server",
				optimizeDeps: {
					entries: [],
				},
				ssr: {
					resolve: {
						conditions: ["react-server"],
					},
					noExternal: true,
					optimizeDeps: {
						include: [
							"react",
							"react/jsx-runtime",
							"react/jsx-dev-runtime",
							"react-server-dom-webpack/server.edge",
						],
					},
				},
			});
		},
		async buildEnd() {
			await $__global.reactServer?.close();
		},
	};

	return [mainPlugin];
}
