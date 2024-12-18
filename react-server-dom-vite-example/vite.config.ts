import assert from "node:assert";
import path from "node:path";
import {
	type Manifest,
	type Plugin,
	type RunnableDevEnvironment,
	createRunnableDevEnvironment,
	defineConfig,
} from "vite";

let clientManifest: Manifest;

export default defineConfig({
	appType: "custom",
	environments: {
		client: {
			build: {
				manifest: true,
				outDir: "dist/client",
				rollupOptions: {
					input: { index: "/src/entry.client.tsx" },
				},
			},
		},
		ssr: {
			build: {
				outDir: "dist/ssr",
				rollupOptions: {
					input: { index: "/src/entry.ssr.tsx" },
				},
			},
		},
		rsc: {
			optimizeDeps: {
				include: [
					"react",
					"react/jsx-runtime",
					"react/jsx-dev-runtime",
					"@jacob-ebey/react-server-dom-vite/server",
				],
			},
			resolve: {
				conditions: ["react-server"],
				noExternal: true,
			},
			dev: {
				createEnvironment(name, config) {
					return createRunnableDevEnvironment(name, config, { hot: false });
				},
			},
			build: {
				outDir: "dist/rsc",
				rollupOptions: {
					input: { index: "/src/entry.rsc.tsx" },
				},
			},
		},
	},
	plugins: [
		{
			name: "ssr-middleware",
			configureServer(server) {
				const ssrRunner = (server.environments.ssr as RunnableDevEnvironment)
					.runner;
				const rscRunner = (server.environments.rsc as RunnableDevEnvironment)
					.runner;
				Object.assign(globalThis, { __rscRunner: rscRunner });
				return () => {
					server.middlewares.use(async (req, res, next) => {
						try {
							const mod: any = await ssrRunner.import("/src/entry.ssr.tsx");
							await mod.default(req, res);
						} catch (e) {
							next(e);
						}
					});
				};
			},
			async configurePreviewServer(server) {
				const mod = await import(path.resolve("dist/ssr/index.js"));
				return () => {
					server.middlewares.use(async (req, res, next) => {
						try {
							await mod.default(req, res);
						} catch (e) {
							next(e);
						}
					});
				};
			},
		},
		{
			name: "virtual:build-rsc-entry",
			resolveId(source) {
				if (source === "virtual:build-rsc-entry") {
					// externalize rsc entry in ssr entry as relative path
					return { id: "../rsc/index.js", external: true };
				}
			},
		},
		createVirtualPlugin("ssr-assets", function () {
			assert(this.environment.name === "ssr");
			let bootstrapModules: string[] = [];
			if (this.environment.mode === "dev") {
				bootstrapModules = ["/src/entry.client.tsx"];
			}
			if (this.environment.mode === "build") {
				bootstrapModules = [clientManifest["src/entry.client.tsx"].file];
			}
			return `export const bootstrapModules = ${JSON.stringify(bootstrapModules)}`;
		}),
		{
			name: "misc",
			writeBundle(_options, bundle) {
				if (this.environment.name === "client") {
					const output = bundle[".vite/manifest.json"];
					assert(output.type === "asset");
					assert(typeof output.source === "string");
					clientManifest = JSON.parse(output.source);
				}
			},
		},
	],
	builder: {
		sharedPlugins: true,
		sharedConfigBuild: true,
		async buildApp(builder) {
			await builder.build(builder.environments.rsc);
			await builder.build(builder.environments.client);
			await builder.build(builder.environments.ssr);
		},
	},
});

function createVirtualPlugin(name: string, load: Plugin["load"]) {
	name = "virtual:" + name;
	return {
		name: `virtual-${name}`,
		resolveId(source, _importer, _options) {
			return source === name ? "\0" + name : undefined;
		},
		load(id, options) {
			if (id === "\0" + name) {
				return (load as Function).apply(this, [id, options]);
			}
		},
	} satisfies Plugin;
}
