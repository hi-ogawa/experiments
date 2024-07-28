import { defineConfig, type RequestHandler, type Rspack } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { webToNodeHandler } from "@hiogawa/utils-node";
import { mkdirSync, writeFileSync } from "fs";

export default defineConfig((env) => ({
	plugins: [pluginReact()],
	environments: {
		web: {
			output: {
				target: "web",
				distPath: {
					root: "dist/client",
				},
			},
			source: {
				entry: {
					index: "./src/entry-client",
				},
				define: {
					"import.meta.env.DEV": env.command === "dev",
					"import.meta.env.SSR": false,
				},
			},
			performance: {
				bundleAnalyze:
					env.command === "build"
						? {
								generateStatsFile: true,
							}
						: undefined,
			},
			tools: {
				rspack: {
					plugins: [
						{
							name: "client-assets",
							apply(compiler: Rspack.Compiler) {
								if (env.command !== "build") return;

								const NAME = this.name;
								compiler.hooks.done.tap(NAME, (stats) => {
									const statsJson = stats.toJson({ all: false, assets: true });
									const code = `export default ${JSON.stringify(statsJson, null, 2)}`;
									mkdirSync("./dist", { recursive: true });
									writeFileSync("./dist/__client_stats.mjs", code);
								});
							},
						},
					],
				},
			},
		},
		ssr: {
			output: {
				target: "node",
				distPath: {
					root: "dist/server",
				},
				filename: {
					js: "[name].cjs",
				},
				minify: false,
			},
			source: {
				entry: {
					index: "./src/entry-server",
				},
				define: {
					"import.meta.env.DEV": env.command === "dev",
					"import.meta.env.SSR": true,
				},
			},
			tools: {
				rspack: {
					dependencies: ["web"],
				},
			},
		},
	},
	// https://rsbuild.dev/config/dev/setup-middlewares
	dev: {
		setupMiddlewares: [
			(middlewares, server) => {
				(globalThis as any).__rsbuild_server__ = server;

				const handleSsr: RequestHandler = async (req, res) => {
					function handlerError(error: unknown) {
						console.error(error);
						res.write("Internal server error");
						res.statusCode = 500;
						res.end();
					}
					try {
						const mod = await server.environments.ssr.loadBundle("index");
						webToNodeHandler((mod as any).default)(req, res, handlerError);
					} catch (e) {
						handlerError(e);
					}
				};

				// need to intercept root html request
				middlewares.unshift((req, res, next) => {
					const url = new URL(req.url ?? "/", "http://tmp.local");
					if (url.pathname === "/") {
						handleSsr(req, res, next);
					} else {
						next();
					}
				});

				middlewares.push((req, res, next) => {
					handleSsr(req, res, next);
				});
			},
		],
	},
}));
