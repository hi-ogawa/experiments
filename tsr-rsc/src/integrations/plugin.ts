import { join, resolve } from "path";
import { readFile, readdir } from "fs/promises";
import {
	type InlineConfig,
	type Plugin,
	type PluginOption,
	build,
	createLogger,
	createServer,
	parseAstAsync,
} from "vite";
import {
	transformDirectiveExpose,
	transformDirectiveProxy,
} from "./flight/plugin";
import { $__global } from "./global";

export function vitePluginReactServer(): PluginOption {
	const reactServerViteConfig: InlineConfig = {
		customLogger: createLogger(undefined, {
			prefix: "[react-server]",
			allowClearScreen: false,
		}),
		clearScreen: false,
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
		build: {
			ssr: true,
			outDir: "dist/server",
			rollupOptions: {
				input: {
					index: "/src/integrations/flight/server",
				},
			},
		},
	};

	const globalPlugin: Plugin = {
		name: vitePluginReactServer.name + ":global",
		configResolved(config) {
			$__global.config = config;
			$__global.clientRefereneIds ??= new Set();
		},
	};

	const devPlugin: Plugin = {
		name: vitePluginReactServer.name + ":dev",
		apply: "serve",
		configureServer(server) {
			$__global.ssrServer = server;
		},
		async buildStart() {
			$__global.reactServer = await createServer(reactServerViteConfig);
		},
		async buildEnd() {
			await $__global.reactServer?.close();
		},
	};

	const buildPlugin: Plugin = {
		name: vitePluginReactServer.name + ":build",
		apply: (_config, env) =>
			(env.command === "build" && !env.isSsrBuild) || !!env.isPreview,
		config(_config, _env) {
			return { build: { outDir: "dist/browser" } };
		},
		async buildStart() {
			await build(reactServerViteConfig);
		},
		async writeBundle() {
			await build({
				build: {
					ssr: true,
					outDir: "dist/ssr",
				},
			});
		},
	};

	return [
		globalPlugin,
		devPlugin,
		buildPlugin,
		vitePluginFlightLoaderClient(),
		vitePluginClientComponentClient(),
	];
}

function vitePluginFlightLoaderClient(): PluginOption {
	const useServerTransform: Plugin = {
		name: vitePluginFlightLoaderClient.name + ":use-server-transform",
		async transform(code, id, _options) {
			if (id.includes("/node_modules")) {
				return;
			}
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

	const buildPlugin = createVirtualPlugin("server-references", async () => {
		// TODO: for now, just crawl files
		const files = await readdir(resolve("src/routes"), {
			recursive: true,
			withFileTypes: true,
		});
		const ids: string[] = [];
		for (const f of files) {
			if (f.isFile()) {
				const id = join(f.parentPath, f.name);
				const data = await readFile(id, "utf-8");
				if (data.includes("use server")) {
					ids.push(id);
				}
			}
		}
		const code = [
			`export default {`,
			...[...ids].map((id) => `"${id}": () => import("${id}"),`),
			`}`,
			"",
		].join("\n");
		return { code, map: null };
	});

	return [useServerTransform, buildPlugin];
}

function vitePluginClientComponentClient(): PluginOption {
	return createVirtualPlugin("client-references", () => {
		const ids = $__global.clientRefereneIds;
		const code = [
			`export default {`,
			...[...ids].map((id) => `"${id}": () => import("${id}"),`),
			`}`,
			"",
		].join("\n");
		return { code, map: null };
	});
}

function vitePluginClientComponentServer(): PluginOption {
	const useClientTransform: Plugin = {
		name: vitePluginClientComponentServer.name + ":use-client-transform",
		async transform(code, id, _options) {
			if (/^("use client")|('use client')/.test(code)) {
				$__global.clientRefereneIds.add(id);
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

function createVirtualPlugin(name: string, load: Plugin["load"]) {
	name = "virtual:" + name;
	return {
		name,
		resolveId(source, _importer, _options) {
			if (source === name || source.startsWith(`${name}?`)) {
				return `\0${source}`;
			}
			return;
		},
		load(id, options) {
			if (id === `\0${name}` || id.startsWith(`\0${name}?`)) {
				return (load as any).apply(this, [id, options]);
			}
		},
	} satisfies Plugin;
}
