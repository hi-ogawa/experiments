import { defineConfig, type RequestHandler, type Rspack } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { webToNodeHandler } from "@hiogawa/utils-node";

export default defineConfig((env) => {
	const dev = env.command === "dev";

	return {
		plugins: [pluginReact()],
		environments: {
			server: {
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
						"import.meta.env.DEV": dev,
						"import.meta.env.SSR": true,
					},
				},
				tools: {
					rspack: {
						resolve: {
							conditionNames: ["react-server", "..."],
						},
					},
				},
			},
			web: {
				output: {
					target: "web",
					distPath: {
						root: "dist/browser",
					},
				},
				source: {
					entry: {
						index: "./src/entry-browser",
					},
					define: {
						"import.meta.env.DEV": dev,
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
						dependencies: ["server"],
					},
				},
			},
			ssr: {
				output: {
					target: "node",
					distPath: {
						root: "dist/ssr",
					},
					filename: {
						js: "[name].cjs",
					},
					minify: false,
				},
				source: {
					entry: {
						index: "./src/entry-ssr",
					},
					define: {
						"import.meta.env.DEV": dev,
						"import.meta.env.SSR": true,
					},
				},
				tools: {
					rspack: {
						dependencies: ["server", "web"],
					},
				},
			},
			server: {
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
						"import.meta.env.DEV": dev,
						"import.meta.env.SSR": true,
					},
				},
				tools: {
					rspack: {
						resolve: {
							conditionNames: ["react-server", "..."],
						},
						plugins: [
							{
								name: "client-reference:server",
								apply(compiler: Rspack.Compiler) {
									const NAME = this.name;
									compiler.hooks.finishMake.tapPromise(
										NAME,
										async (compilation) => {
											// TODO: include reference entries
											compilation;
										},
									);
								},
							},
						],
					},
				},
			},
		},
		// https://rsbuild.dev/config/dev/setup-middlewares
		dev: {
			writeToDisk: true, // for debugging for now
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
	};
});
