import fs from "node:fs";
import * as rolldown from "rolldown";
import {
	type Plugin,
	type ViteDevServer,
	defineConfig,
	loadConfigFromFile,
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
	let server: ViteDevServer;

	return {
		name: viteroll.name,
		config() {
			return {
				appType: "custom",
			};
		},
		configureServer(server_) {
			server = server_;

			server.middlewares.use((req, res, next) => {
				const url = new URL(req.url ?? "/", "https://vite.dev/");
				// html
				if (url.pathname === "/") {
					// reuse /@vite/client for easy full reload
					res.end(`
						<html lang="en">
							<head>
								<meta charset="UTF-8" />
								<meta name="viewport" content="width=device-width, initial-scale=1.0" />
								<title>vite bundled dev</title>
								<script src="/@vite/client" type="module"></script>
							</head>
							<body>
								hello
								<script src="/main.js"></script>
							</body>
						</html>
					`);
					return;
				}
				// js
				if (url.pathname === "/main.js") {
					const content = fs.readFileSync("dist/rolldown/main.js");
					send(req, res, content, "js", {});
					return;
				}
				next();
			});
		},
		async buildStart() {
			// TODO: patch runtime (e.g. new WebSocket(`ws://localhost:8080`))
			// TODO: log build time
			loadConfigFromFile;
			rolldownBuild = await rolldown.rolldown({
				dev: true,
				input: {
					main: "./src/main.ts",
				},
				// TODO: reuse some plugins via loadConfigFromFile
				plugins: [],
			});
			await rolldownBuild.write({
				dir: "dist/rolldown",
				format: "app",
			});
		},
		async buildEnd() {
			await rolldownBuild.close();
		},
		handleHotUpdate(ctx) {
			// TODO
			ctx.file;
			rolldownBuild.experimental_hmr_rebuild;
		},
	};
}
