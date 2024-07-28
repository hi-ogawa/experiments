import {
	defineConfig,
	type RequestHandler,
	type Rspack,
	type RspackRule,
} from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { webToNodeHandler } from "@hiogawa/utils-node";
import path from "node:path";
import { writeFileSync } from "node:fs";
import { tinyassert } from "@hiogawa/utils";
import type { PreliminaryManifest } from "./src/lib/client-manifest";

export default defineConfig((env) => {
	const dev = env.command === "dev";

	const clientReferences = new Set<string>();
	// for now manually added
	clientReferences.add(path.resolve("./src/routes/_client.tsx"));

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
					minify: false,
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
				tools: {
					rspack: (config, utils) => {
						config.dependencies ??= [];
						config.dependencies.push("server");

						utils.addRules([
							createVirtualModuleRule(
								path.resolve("./src/lib/virtual-client-references-browser.js"),
								() => {
									// fake side effect to avoid tree shaking
									return [
										`export default Math.random() < 0 && [`,
										...[...clientReferences].map(
											(file) => `import(${JSON.stringify(file)}),`,
										),
										`]`,
									].join("\n");
								},
							),
						]);

						utils.appendPlugins([
							{
								name: "rsc-plugin-browser",
								apply(compiler: Rspack.Compiler) {
									const NAME = "rsc-plugin-browser";

									// generate browser client manifest
									// NOTE: it looks like rspack is missing a few APIs
									// - moduleGraph.getOutgoingConnectionsByModule
									// - chunkGraph.getModuleChunksIterable
									// - chunkGraph.getModuleId
									// but something similar seems possible by probing stats json

									compiler.hooks.done.tap(NAME, (stats) => {
										const preliminaryManifest: PreliminaryManifest = {};

										const statsJson = stats.toJson();
										tinyassert(statsJson.chunks);
										for (const chunk of statsJson.chunks) {
											tinyassert(chunk.modules);
											for (const mod of chunk.modules) {
												if (!mod.nameForCondition) continue;
												if (clientReferences.has(mod.nameForCondition)) {
													tinyassert(mod.id);
													tinyassert(chunk.id);
													// TODO: should also ensure chunk.parents (dependent chunks)?
													const [file] = [...chunk.files];
													preliminaryManifest[mod.nameForCondition] = {
														id: mod.id,
														chunks: [chunk.id, file],
													};
												}
											}
										}

										const code = `export default ${JSON.stringify(preliminaryManifest, null, 2)}`;
										writeFileSync("./dist/__client_manifest_browser.mjs", code);
									});
								},
							},
						]);

						utils.appendPlugins([
							{
								name: "client-assets",
								apply(compiler: Rspack.Compiler) {
									const NAME = "client-assets";
									compiler.hooks.done.tap(NAME, (stats) => {
										const statsJson = stats.toJson({
											all: false,
											assets: true,
										});
										const code = `export default ${JSON.stringify(statsJson, null, 2)}`;
										writeFileSync("./dist/__client_stats.mjs", code);
									});
								},
							},
						]);
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
					rspack: (config, utils) => {
						config.dependencies ??= [];
						config.dependencies.push("server", "web");

						utils.addRules([
							createVirtualModuleRule(
								path.resolve("./src/lib/virtual-client-references-ssr.js"),
								() => {
									// fake side effect to avoid tree shaking
									return [
										`export default Math.random() < 0 && [`,
										...[...clientReferences].map(
											(file) =>
												`import(/* webpackMode: "eager" */ ${JSON.stringify(file)}),`,
										),
										`]`,
									].join("\n");
								},
							),
						]);

						utils.appendPlugins([
							{
								name: "rsc-plugin-ssr",
								apply(compiler: Rspack.Compiler) {
									const NAME = "rsc-plugin-ssr";

									compiler.hooks.done.tap(NAME, (stats) => {
										const preliminaryManifest: PreliminaryManifest = {};

										const statsJson = stats.toJson();
										tinyassert(statsJson.chunks);
										for (const chunk of statsJson.chunks) {
											tinyassert(chunk.modules);
											for (const mod of chunk.modules) {
												if (!mod.nameForCondition) continue;
												if (clientReferences.has(mod.nameForCondition)) {
													tinyassert(mod.id);
													preliminaryManifest[mod.nameForCondition] = {
														id: mod.id,
														chunks: [],
													};
												}
											}
										}

										const code = `export default ${JSON.stringify(preliminaryManifest, null, 2)}`;
										writeFileSync("./dist/__client_manifest_ssr.mjs", code);
									});
								},
							},
						]);
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

function createVirtualModuleRule(
	file: string,
	getCode: () => string,
): RspackRule {
	return {
		resource: file,
		use: {
			loader: path.resolve("./src/lib/webpack/virtual-module-loader.js"),
			options: {
				getCode,
			},
		},
	};
}
