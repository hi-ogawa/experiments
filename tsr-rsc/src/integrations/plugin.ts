import { type Plugin, type PluginOption, createServer } from "vite";
import { $__global } from "./global";

export function vitePluginReactServer(): PluginOption {
	const mainPlugin: Plugin = {
		name: vitePluginReactServer.name,
		configureServer(server) {
			$__global.ssrServer = server;
		},
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
				plugins: [],
			});
		},
		async buildEnd() {
			await $__global.reactServer?.close();
		},
	};

	return [mainPlugin, vitePluginFlightLoaderClient()];
}

function vitePluginFlightLoaderClient(): PluginOption {
	const useServerTransform: Plugin = {
		name: vitePluginFlightLoaderClient.name + ":use-server-transform",
		transform(code, id, _options) {
			if (/^("use server"|'use server')/.test(code)) {
				const matches = code.matchAll(/function (\w*)/g);
				const names = [...matches].map((m) => m[1]);
				const output = [
					`import { createFlightLoader as $$flight } from "/src/integrations/flight/client"`,
					...names.map(
						(name) => `export const ${name} = $$flight("${id + "#" + name}")`,
					),
				].join(";\n");
				return { code: output, map: null };
			}
		},
	};

	return [useServerTransform];
}
