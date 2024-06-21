import { cpSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createManualPromise, tinyassert, uniq } from "@hiogawa/utils";
import { webToNodeHandler } from "@hiogawa/utils-node";
import webpack from "webpack";
import { BuildManager } from "./src/lib/build-manager.js";

// SSR setup is based on
// https://github.com/hi-ogawa/reproductions/tree/main/webpack-react-ssr

const require = createRequire(import.meta.url);

/**
 * @param {{ WEBPACK_BUILD?: boolean }} env
 * @param {unknown} _argv
 * @returns {import("webpack").Configuration[]}
 */
export default function (env, _argv) {
	const dev = !env.WEBPACK_BUILD;

	const manager = new BuildManager();

	const LAYER = {
		ssr: "ssr",
		server: "server",
	};

	const esbuildLoader = {
		loader: "esbuild-loader",
		options: {
			target: "es2020",
		},
	};

	/**
	 * @satisfies {import("webpack").Configuration}
	 */
	const commonConfig = {
		mode: dev ? "development" : "production",
		devtool: "source-map",
		resolve: {
			extensions: [".tsx", ".ts", "..."],
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: esbuildLoader,
				},
				// https://webpack.js.org/guides/asset-modules/#source-assets
				// https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax
				{
					resourceQuery: /raw/,
					type: "asset/source",
				},
				{
					resourceQuery: /inline/,
					type: "asset/inline",
				},
				{
					resourceQuery: /url/,
					type: "asset/resource",
				},
			],
		},
	};

	/**
	 * @type {import("webpack").Configuration}
	 */
	const serverConfig = {
		...commonConfig,
		name: "server",
		target: "node",
		entry: {
			index: "./src/entry-ssr-layer",
		},
		output: {
			path: path.resolve("./dist/server"),
			filename: "[name].cjs",
			library: {
				// https://webpack.js.org/configuration/output/#outputlibrarytype
				type: "commonjs-static",
			},
			clean: true,
		},
		optimization: {
			minimize: false,
		},
		// TODO: https://webpack.js.org/configuration/externals
		externals: {},
		experiments: { layers: true },
		module: {
			parser: {
				javascript: {
					// https://webpack.js.org/configuration/module/#moduleparserjavascriptcommonjsmagiccomments
					commonjsMagicComments: true,
				},
			},
			rules: [
				{
					test: path.resolve("./src/entry-server-layer.tsx"),
					layer: LAYER.server,
				},
				{
					test: path.resolve("./src/entry-ssr-layer.tsx"),
					layer: LAYER.ssr,
				},
				{
					issuerLayer: LAYER.server,
					resolve: {
						conditionNames: ["react-server", "..."],
					},
				},
				{
					issuerLayer: LAYER.server,
					test: /\.[cm]?[jt]sx?$/,
					use: {
						loader: path.resolve(
							"./src/lib/webpack/loader-server-use-client.js",
						),
						options: { manager },
					},
				},
				{
					issuerLayer: LAYER.server,
					test: /\.[cm]?[jt]sx?$/,
					use: {
						loader: path.resolve(
							"./src/lib/webpack/loader-server-use-server.js",
						),
						options: { manager },
					},
				},
				{
					issuerLayer: LAYER.ssr,
					test: /\.[cm]?[jt]sx?$/,
					use: {
						loader: path.resolve(
							"./src/lib/webpack/loader-client-use-server.js",
						),
						options: {
							runtime: "react-server-dom-webpack/client.edge",
							manager,
						},
					},
				},
				...commonConfig.module.rules,
			],
		},
		plugins: [
			new webpack.DefinePlugin({
				"__define.SSR": "true",
				"__define.DEV": dev,
			}),
			{
				name: "client-reference:server",
				apply(compiler) {
					const NAME = /** @type {any} */ (this).name;

					// inject discovered client/server references to ssr/server layers
					// cf. FlightClientEntryPlugin.injectClientEntryAndSSRModules
					// https://github.com/vercel/next.js/blob/cbbe586f2fa135ad5859ae6c38ac879c086927ef/packages/next/src/build/webpack/plugins/flight-client-entry-plugin.ts#L747
					compiler.hooks.finishMake.tapPromise(NAME, async (compilation) => {
						// server references are discovered when including client reference modules
						// so the order matters
						for (const reference in manager.clientReferenceMap) {
							await includeReference(compilation, reference, LAYER.ssr);
						}
						for (const reference in manager.serverReferenceMap) {
							await includeReference(compilation, reference, LAYER.server);
						}
					});

					// generate client manifest
					compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
						compilation.hooks.processAssets.tap(
							{
								name: NAME,
								stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
							},
							() => {
								/** @type {import("./src/lib/client-manifest").ReferenceMap} */
								const clientMap = {};
								/** @type {import("./src/lib/client-manifest").ReferenceMap} */
								const serverMap = {};

								for (const mod of compilation.modules) {
									const modName = mod.nameForCondition();
									if (!modName) continue;

									const clientId = manager.clientReferenceMap[modName];
									if (clientId && mod.layer === LAYER.ssr) {
										clientMap[clientId] = {
											id: compilation.chunkGraph.getModuleId(mod),
											chunks: [],
										};
									}
									const serverId = manager.serverReferenceMap[modName];
									if (serverId && mod.layer === LAYER.server) {
										serverMap[serverId] = {
											id: compilation.chunkGraph.getModuleId(mod),
											chunks: [],
										};
									}
								}

								compilation.emitAsset(
									"__client_reference_ssr.cjs",
									new webpack.sources.RawSource(
										`module.exports = ${JSON.stringify(clientMap, null, 2)}`,
									),
								);
								compilation.emitAsset(
									"__server_reference.cjs",
									new webpack.sources.RawSource(
										`module.exports = ${JSON.stringify(serverMap, null, 2)}`,
									),
								);
							},
						);
					});
				},
			},
			// https://webpack.js.org/contribute/writing-a-plugin/#example
			dev && {
				name: "dev-ssr",
				apply(compiler) {
					const NAME = /** @type {any} */ (this).name;
					const serverDir = path.resolve("./dist/server");
					const serverPath = path.join(serverDir, "index.cjs");

					/** @type {import("webpack-dev-server")} */
					let devServer;

					/**
					 * @type {import("webpack-dev-server").Configuration}
					 */
					const devServerConfig = {
						hot: false,
						host: "localhost",
						static: {
							serveIndex: false,
						},
						// https://github.com/webpack/webpack-dev-middleware#server-side-rendering
						devMiddleware: {
							writeToDisk: true,
							serverSideRender: true,
						},
						// https://webpack.js.org/configuration/dev-server/#devserversetupmiddlewares
						setupMiddlewares: (middlewares, devServer_) => {
							devServer = devServer_;

							middlewares.push({
								name: "dev-ssr",
								// @ts-ignore
								middleware: (req, res, next) => {
									// disable compression for streaming
									delete req.headers["accept-encoding"];

									/** @type {import("./src/entry-ssr-layer")} */
									const mod = require(serverPath);
									const nodeHandler = webToNodeHandler((request) =>
										mod.handler(request),
									);
									nodeHandler(req, res, next);
								},
							});
							return middlewares;
						},
					};
					compiler.options.devServer = devServerConfig;

					// https://webpack.js.org/api/compiler-hooks/
					compiler.hooks.invalid.tap(NAME, () => {
						// TODO: when to invalidate client references?
						manager.clientReferenceMap;

						// invalidate all server cjs
						for (const key in require.cache) {
							if (key.startsWith(serverDir)) {
								delete require.cache[key];
							}
						}

						// custom event to full reload browser
						tinyassert(devServer);
						tinyassert(devServer.webSocketServer);
						devServer.sendMessage(
							devServer.webSocketServer.clients,
							"custom:update-server",
						);
					});
				},
			},
		],
	};

	/**
	 * @type {import("webpack").Configuration}
	 */
	const browserConfig = {
		...commonConfig,
		name: "browser",
		target: "web",
		dependencies: ["server"],
		entry: {
			index: "./src/entry-browser",
		},
		output: {
			// https://webpack.js.org/guides/public-path/
			publicPath: "/assets/",
			path: path.resolve("./dist/browser/assets"),
			filename: dev ? "[name].js" : "[name].[contenthash:8].js",
			clean: true,
		},
		module: {
			rules: [
				{
					test: path.resolve("./src/lib/client-references-browser.js"),
					use: {
						loader: path.resolve("./src/lib/webpack/loader-virtual.js"),
						options: {
							getCode: () => {
								return [
									`export default [`,
									...Object.values(manager.clientReferenceMap).map(
										(file) =>
											`() => import(${JSON.stringify(path.join("../..", file))}),`,
									),
									`]`,
								].join("\n");
							},
						},
					},
				},
				{
					test: /\.[cm]?[jt]sx$/,
					use: "@hiogawa/tiny-refresh/webpack",
				},
				{
					test: /\.[cm]?[jt]sx?$/,
					use: {
						loader: path.resolve(
							"./src/lib/webpack/loader-client-use-server.js",
						),
						options: {
							runtime: "react-server-dom-webpack/client.browser",
							manager,
						},
					},
				},
				...commonConfig.module.rules,
			],
		},
		plugins: [
			new webpack.DefinePlugin({
				"__define.SSR": "false",
				"__define.DEV": dev,
			}),
			{
				name: "client-reference:browser",
				apply(compiler) {
					const NAME = /** @type {any} */ (this).name;

					// generate client manifest
					// https://github.com/unstubbable/mfng/blob/251b5284ca6f10b4c46e16833dacf0fd6cf42b02/packages/webpack-rsc/src/webpack-rsc-client-plugin.ts#L193
					compiler.hooks.afterCompile.tapPromise(NAME, async (compilation) => {
						/** @type {import("./src/lib/client-manifest").ReferenceMap} */
						const data = {};

						for (const mod of compilation.modules) {
							const modName = mod.nameForCondition();
							if (!modName) continue;

							const clientId = manager.clientReferenceMap[modName];
							if (clientId) {
								const mods = collectModuleDeps(compilation, mod);
								const chunks = uniq(
									[...mods].flatMap((mod) => [
										...compilation.chunkGraph.getModuleChunksIterable(mod),
									]),
								);
								/** @type {import("./src/types/react-types").ModuleId[]} */
								const chunkIds = [];
								for (const chunk of chunks) {
									if (chunk.id !== null) {
										for (const file of chunk.files) {
											chunkIds.push(chunk.id, file);
										}
									}
								}
								data[clientId] = {
									id: compilation.chunkGraph.getModuleId(mod),
									chunks: chunkIds,
								};
							}
						}

						const code = `module.exports = ${JSON.stringify(data, null, 2)}`;
						writeFileSync("./dist/server/__client_reference_browser.cjs", code);
					});
				},
			},
			{
				name: "client-stats",
				apply(compiler) {
					const NAME = /** @type {any} */ (this).name;
					compiler.hooks.done.tap(NAME, (stats) => {
						const statsJson = stats.toJson({ chunks: false, modules: false });
						const code = `module.exports = ${JSON.stringify(statsJson, null, 2)}`;
						writeFileSync("./dist/server/__client_stats.cjs", code);
					});
				},
			},
			!dev && {
				name: "copy-public",
				apply(compiler) {
					const NAME = /** @type {any} */ (this).name;
					compiler.hooks.done.tap(NAME, () => {
						cpSync("public", "dist/browser", { recursive: true });
					});
				},
			},
		],
	};

	return [serverConfig, browserConfig];
}

/**
 *
 * @param {import("webpack").Compilation} compilation
 * @param {string} reference
 * @param {string} issuerLayer
 */
function includeReference(compilation, reference, issuerLayer) {
	const [mainEntry] = compilation.entries.values();
	tinyassert(mainEntry);

	const dependency = webpack.EntryPlugin.createDependency(reference, {});
	mainEntry.includeDependencies.push(dependency);

	const promise = createManualPromise();
	compilation.addModuleTree(
		{
			context: compilation.compiler.context,
			dependency,
			contextInfo: { issuerLayer },
		},
		(err, mod) => {
			// force exports on build
			// cf. https://github.com/unstubbable/mfng/blob/251b5284ca6f10b4c46e16833dacf0fd6cf42b02/packages/webpack-rsc/src/webpack-rsc-server-plugin.ts#L124-L126
			if (
				mod &&
				compilation.moduleGraph
					.getExportsInfo(mod)
					.setUsedInUnknownWay(undefined)
			) {
				promise.resolve(null);
				return;
			}
			promise.reject(err ?? new Error("failed include reference"));
		},
	);
	return promise;
}

/**
 *
 * @param {import("webpack").Compilation} compilation
 * @param {import("webpack").Module} mod
 */
function collectModuleDeps(compilation, mod) {
	/** @type {Set<import("webpack").Module>} */
	const visited = new Set();

	/**
	 *
	 * @param {import("webpack").Module} mod
	 */
	function recurse(mod) {
		if (visited.has(mod)) {
			return;
		}
		visited.add(mod);
		const outMods = compilation.moduleGraph.getOutgoingConnectionsByModule(mod);
		if (outMods) {
			for (const outMod of outMods.keys()) {
				if (outMod) {
					recurse(outMod);
				}
			}
		}
	}

	recurse(mod);

	return visited;
}
