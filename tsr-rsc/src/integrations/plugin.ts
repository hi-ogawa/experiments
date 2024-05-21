import { type Plugin, type PluginOption, createServer } from "vite";
import {
	transformDirectiveExpose,
	transformDirectiveProxy,
} from "./flight/plugin";
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
				plugins: [vitePluginFlightLoaderServer()],
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
		async transform(code, id, _options) {
			// "use server" file
			if (/^("use server"|'use server')/.test(code)) {
				const matches = code.matchAll(/function (\w*)/g);
				const names = [...matches].map((m) => m[1]);
				const output = [
					`import { createFlightLoader as $$flight } from "/src/integrations/flight/client"`,
					...names.map(
						// TODO: default
						(name) => `export const ${name} = $$flight("${id + "#" + name}")`,
					),
				].join(";\n");
				return { code: output, map: null };
			}
			// "use server" function
			if (/("use server"|'use server')/.test(code)) {
				const result = await transformDirectiveProxy(code, id);
				return {
					code: result.output.toString(),
					map: result.output.generateMap(),
				};
			}
		},
	};

	return [useServerTransform];
}

function vitePluginFlightLoaderServer(): PluginOption {
	const useServerTransform: Plugin = {
		name: vitePluginFlightLoaderClient.name + ":use-server-transform",
		async transform(code, _id, _options) {
			// "use server" file (no-op)
			if (/^("use server"|'use server')/.test(code)) {
				return;
			}
			// "use server" function
			if (/("use server"|'use server')/.test(code)) {
				const result = await transformDirectiveExpose(code);
				return {
					code: result.output.toString(),
					map: result.output.generateMap(),
				};
			}
		},
	};

	return [useServerTransform];
}
