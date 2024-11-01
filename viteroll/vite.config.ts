import * as rolldown from "rolldown";
import {
	type Plugin,
	type ViteDevServer,
	createLogger,
	defineConfig,
	send,
} from "vite";

export default defineConfig({
	clearScreen: false,
	optimizeDeps: {
		noDiscovery: true,
	},
	plugins: [viteroll()],
});

function viteroll(): Plugin {
	let rolldownBuild: rolldown.RolldownBuild;
	let rolldownOutput: rolldown.RolldownOutput;
	let server: ViteDevServer;
	const logger = createLogger("info", {
		prefix: "[rolldown]",
		allowClearScreen: false,
	});

	async function fullBuild() {
		if (rolldownBuild) {
			await rolldownBuild?.close();
		}

		// TODO: log build time
		rolldownBuild = await rolldown.rolldown({
			dev: true,
			input: {
				index: "./src/index.ts",
			},
			// TODO: reuse plugins via loadConfigFromFile?
			plugins: [],
		});
		// `generate` works but uses `write` so it's easier to see output and debug
		rolldownOutput = await rolldownBuild.write({
			dir: "dist/rolldown",
			format: "app",
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
								<script src="/@vite/client" type="module"></script>
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
				if (process.env["VITEROLL_HMR"]) {
					const content = await ctx.read();
					if (content.includes("module.hot.accept")) {
						logger.info(`hmr '${ctx.file}'`, { timestamp: true });
						const result = await rolldownBuild.experimental_hmr_rebuild([
							ctx.file,
						]);
						server.ws.send("rolldown-hmr-update", result);
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
