import assert from "node:assert";
import * as rolldown from "rolldown";
import {
	type Plugin,
	type ResolvedConfig,
	type ViteDevServer,
	createLogger,
	defineConfig,
	loadConfigFromFile,
	send,
} from "vite";

export default defineConfig({
	clearScreen: false,
	optimizeDeps: {
		noDiscovery: true,
	},
	plugins: [
		viteroll(),
		{
			name: "test-virtual",
			resolveId: {
				filter: {
					id: {
						include: ["virtual:test"],
					},
				},
				handler(source) {
					if (source === "virtual:test") {
						return `\0virtual:test`;
					}
				},
			},
			load: {
				filter: {
					id: {
						include: ["\0virtual:test"],
					},
				},
				handler(id) {
					if (id === "\0virtual:test") {
						return `export default "ok"`;
					}
				},
			},
		} satisfies rolldown.Plugin as Plugin,
	],
	define: {
		__TEST_DEFINE__: `"ok"`,
	},
});

function viteroll(): Plugin {
	let rolldownBuild: rolldown.RolldownBuild;
	let rolldownOutput: rolldown.RolldownOutput;
	let server: ViteDevServer;
	let config: ResolvedConfig;

	// TODO: log build time
	const logger = createLogger("info", {
		prefix: "[rolldown]",
		allowClearScreen: false,
	});

	async function fullBuild() {
		if (rolldownBuild) {
			await rolldownBuild?.close();
		}

		// load fresh user plugins
		assert(config.configFile);
		const loaded = await loadConfigFromFile(
			{ command: "serve", mode: "development" },
			config.configFile,
			config.root,
		);
		assert(loaded);
		const plugins = loaded.config.plugins?.filter(
			(v) => v && "name" in v && v.name !== viteroll.name,
		);

		rolldownBuild = await rolldown.rolldown({
			dev: true,
			input: {
				index: "./src/index.ts",
			},
			// TODO: define not working?
			define: config.define,
			cwd: config.root,
			platform: "browser",
			resolve: {
				conditionNames: config.resolve.conditions,
				mainFields: config.resolve.mainFields,
				symlinks: config.resolve.preserveSymlinks,
				// TODO: rollup alias
				// alias: config.resolve.alias as any,
			},
			plugins: plugins as any,
		});

		// `generate` works but we use `write` so it's easier to see output and debug
		rolldownOutput = await rolldownBuild.write({
			dir: "dist/rolldown",
			format: "app",
			sourcemap: "inline",
		});
		// TODO: crashes on getter access later?
		rolldownOutput = JSON.parse(JSON.stringify(rolldownOutput, null, 2));
	}

	return {
		name: viteroll.name,
		config() {
			return {
				appType: "custom",
			};
		},
		configResolved(config_) {
			config = config_;
		},
		configureServer(server_) {
			server = server_;

			// rolldown server as middleware
			server.middlewares.use((req, res, next) => {
				const url = new URL(req.url ?? "/", "https://vite.dev/");
				// html
				if (url.pathname === "/") {
					// reuse /@vite/client for websocket client
					res.end(`
						<html lang="en">
							<head>
								<meta charset="UTF-8" />
								<meta name="viewport" content="width=device-width, initial-scale=1.0" />
								<title>vite bundled dev</title>
								<script type="module">
									import { createHotContext } from "/@vite/client";
									const hot = createHotContext("/__rolldown");
									hot.on("rolldown:hmr", (data) => {
										(0, eval)(data[1]);
									});
								</script>
							</head>
							<body>
								<div id="root"></div>
								<script src="/index.js"></script>
							</body>
						</html>
					`);
					return;
				}
				// js
				if (url.pathname === "/index.js") {
					// patch runtime to remove WebSocket(`ws://localhost:8080`)
					let content = rolldownOutput.output[0].code;
					content = content.replace(/const socket =.*?\n};/s, "");
					send(req, res, content, "js", {});
					return;
				}
				// patch out /@vite/env
				if (url.pathname.includes("/vite/dist/client/env.mjs")) {
					send(req, res, "/* patch no-op */", "js", {});
					return;
				}
				next();
			});
		},
		async buildStart() {
			await fullBuild();
		},
		async buildEnd() {
			await rolldownBuild.close();
		},
		async handleHotUpdate(ctx) {
			const moduleIds = rolldownOutput.output[0].moduleIds;
			if (moduleIds.includes(ctx.file)) {
				// hmr
				if (process.env["VITEROLL_HMR"] !== "false") {
					const content = await ctx.read();
					if (content.includes("module.hot.accept")) {
						logger.info(`hmr '${ctx.file}'`, { timestamp: true });
						const result = await rolldownBuild.experimental_hmr_rebuild([
							ctx.file,
						]);
						server.ws.send("rolldown:hmr", result);
						return [];
					}
				}
				// full reload
				logger.info(`full-reload '${ctx.file}'`, { timestamp: true });
				await fullBuild();
				server.ws.send({ type: "full-reload", path: ctx.file });
			}
		},
	};
}
