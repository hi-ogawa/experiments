import {
	type Plugin,
	type PluginOption,
	createServer,
	parseAstAsync,
} from "vite";
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
				plugins: [
					vitePluginFlightLoaderServer(),
					vitePluginClientComponentServer(),
				],
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

function vitePluginClientComponentServer(): PluginOption {
	const useClientTransform: Plugin = {
		name: vitePluginClientComponentServer.name + ":use-client-transform",
		async transform(code, id, _options) {
			if (/^("use client")|('use client')/.test(code)) {
				const { names } = await transformUseClient(code);
				let result = `import { registerClientReference as $$register } from "/src/integrations/flight/server";\n`;
				for (const name of names) {
					result += `export const ${name} = $$register("${id}", "${name}");\n`;
				}
				return { code: result, map: null };
			}
		},
	};

	return [useClientTransform];
}

async function transformUseClient(input: string) {
	const ast = await parseAstAsync(input);
	const names = new Set<string>();

	for (const node of ast.body) {
		if (node.type === "ExportNamedDeclaration") {
			if (node.declaration) {
				if (
					node.declaration.type === "FunctionDeclaration" ||
					node.declaration.type === "ClassDeclaration"
				) {
					/**
					 * export function foo() {}
					 */
					names.add(node.declaration.id.name);
				} else if (node.declaration.type === "VariableDeclaration") {
					/**
					 * export const foo = 1, bar = 2
					 */
					for (const decl of node.declaration.declarations) {
						if (decl.id.type === "Identifier") {
							names.add(decl.id.name);
						}
					}
				}
			} else {
				if (node.source) {
					/**
					 * export { foo, bar as car } from './foo'
					 */
					for (const spec of node.specifiers) {
						names.add(spec.exported.name);
					}
				} else {
					/**
					 * export { foo, bar as car }
					 */
					for (const spec of node.specifiers) {
						names.add(spec.exported.name);
					}
				}
			}
		}
	}

	return { names };
}
