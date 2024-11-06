import path from "node:path";
import { defineConfig } from "vite";
import { viteroll } from "../../viteroll";

export default defineConfig({
	environments: {
		client: {
			build: {
				outDir: "dist/client",
				rollupOptions: {
					input: "./src/entry-client.js",
				},
			},
		},
		ssr: {
			build: {
				outDir: "dist/server",
				rollupOptions: {
					input: "./src/entry-server.js",
				},
			},
		},
	},
	plugins: [
		viteroll(),
		{
			name: "ssr-middleware",
			config() {
				return {
					appType: "custom",
				};
			},
			configureServer(server) {
				return () => {
					server.middlewares.use(async (req, res, next) => {
						const url = new URL(req.url ?? "/", "http://localhost");
						if (url.pathname === "/") {
							try {
								// TODO: move to environment api
								const entry = path.resolve("dist/server/entry-server.js");
								// TODO: invalidate on build update
								const mod = await import(entry + "?t=" + Date.now());
								await mod.default(req, res);
							} catch (e) {
								next(e);
							}
							return;
						}
						next();
					});
				};
			},
		},
	],
});
