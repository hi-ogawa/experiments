import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import { webToNodeHandler } from "@hiogawa/utils-node";
import webpack from "webpack";

// SSR setup is based on
// https://github.com/hi-ogawa/reproductions/tree/main/webpack-react-ssr

// `require` cjs server code for dev ssr
const require = createRequire(import.meta.url);

/**
 * @param {{ WEBPACK_SERVE?: boolean, WEBPACK_BUILD?: boolean }} env
 * @param {unknown} _argv
 * @returns {import("webpack").Configuration[]}
 */
export default function (env, _argv) {
	const dev = !env.WEBPACK_BUILD;

	/** @type {Set<string>} */
	const clientReferences = new Set();

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
					use: "esbuild-loader",
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
			],
		},
	};

	/**
	 * @type {import("webpack").Configuration}
	 */
	const serverConfig = {
		...commonConfig,
		name: "server",
		target: "node20",
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
			rules: [
				{
					layer: "server",
					resource: /\/entry-server-layer\./,
				},
				{
					layer: "ssr",
					resource: /\/entry-ssr-layer\./,
				},
				{
					issuerLayer: "server",
					resolve: {
						conditionNames: ["react-server", "..."],
					},
				},
				{
					issuerLayer: "server",
					// TODO: should skip "esbuild-loader" for plain js?
					test: /\.[tj]sx?$/,
					use: [
						{
							loader: path.resolve("./src/lib/loader-server-use-client.js"),
							options: { clientReferences },
						},
						"esbuild-loader",
					],
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
					compiler.hooks.finishMake.tapPromise(NAME, async (compilation) => {
						// inject discovered client references to ssr entries
						// cf. FlightClientEntryPlugin.injectClientEntryAndSSRModules
						// https://github.com/vercel/next.js/blob/cbbe586f2fa135ad5859ae6c38ac879c086927ef/packages/next/src/build/webpack/plugins/flight-client-entry-plugin.ts#L747
						for (const id of clientReferences) {
							const dep = webpack.EntryPlugin.createDependency(id, {});
							await new Promise((resolve, reject) => {
								compilation.addEntry(
									compiler.context,
									dep,
									{ layer: "ssr" },
									(err) => (err ? reject(err) : resolve(null)),
								);
							});
						}
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
		plugins: [
			new webpack.DefinePlugin({
				"__define.SSR": "false",
				"__define.DEV": dev,
			}),
			{
				name: "client-reference:browser",
				apply(compiler) {
					const NAME = /** @type {any} */ (this).name;

					// inject client reference entries (TODO: lazy dep)
					compiler.hooks.make.tapPromise(NAME, async (compilation) => {
						for (const id of clientReferences) {
							const dep = webpack.EntryPlugin.createDependency(id, {});
							await new Promise((resolve, reject) => {
								compilation.addEntry(compiler.context, dep, {}, (err) =>
									err ? reject(err) : resolve(null),
								);
							});
						}
					});

					// generate client manifest
					compiler.hooks.afterCompile.tapPromise(NAME, async (compilation) => {
						// not sure what's public API...
						// https://webpack.js.org/api/compilation-object/
						for (const mod of compilation.modules) {
							if (
								mod instanceof webpack.NormalModule &&
								clientReferences.has(mod.resource)
							) {
								const moduleId = compilation.chunkGraph.getModuleId(mod);
								console.log(mod.resource);
								console.log(moduleId);
							}
						}
					});
				},
			},
			!dev && {
				name: "client-stats",
				apply(compiler) {
					const NAME = /** @type {any} */ (this).name;
					compiler.hooks.done.tap(NAME, (stats) => {
						const statsJson = stats.toJson({ all: false, assets: true });
						const code = `export default ${JSON.stringify(statsJson, null, 2)}`;
						writeFileSync("./dist/server/__client_stats.js", code);
					});
				},
			},
		],
	};

	return [serverConfig, browserConfig];
}
