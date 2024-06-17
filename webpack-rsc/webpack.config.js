// @ts-check

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

// https://webpack.js.org/configuration/configuration-types/
// https://github.com/unstubbable/mfng/blob/251b5284ca6f10b4c46e16833dacf0fd6cf42b02/apps/aws-app/webpack.config.js

/**
 * @param {{ WEBPACK_SERVE?: boolean, WEBPACK_BUILD?: boolean }} env
 * @param {unknown} _argv
 * @returns {import("webpack").Configuration[]}
 */
export default function (env, _argv) {
	const dev = !env.WEBPACK_BUILD;

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
				...commonConfig.module.rules,
			],
		},
		plugins: [
			new webpack.DefinePlugin({
				"__define.SSR": "true",
				"__define.DEV": dev,
			}),
			// https://webpack.js.org/contribute/writing-a-plugin/#example
			dev && {
				name: "dev-ssr",
				apply(compiler) {
					const name = "dev-ssr";
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
					compiler.hooks.invalid.tap(name, () => {
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
			!dev && {
				name: "client-stats",
				apply(compilation) {
					compilation.hooks.done.tap("client-stats", (stats) => {
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
