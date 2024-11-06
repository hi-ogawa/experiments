import path from "node:path";
import { defineConfig } from "vite";
import { viteroll } from "../../viteroll";

export default defineConfig({
	environments: {
		client: {
			build: {
				outDir: "dist/client",
				rollupOptions: {
					input: "./src/entry-client",
				},
			},
		},
		ssr: {
			build: {
				outDir: "dist/server",
				rollupOptions: {
					input: "./src/entry-server",
				},
			},
		},
	},
	plugins: [
		viteroll({
			reactRefresh: true,
		}),
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
						try {
							// TODO: move to environment api
							const entry = path.resolve("dist/server/entry-server.js");
							// TODO: invalidate on build update
							const mod = await import(entry + "?t=" + Date.now());
							await mod.default(req, res);
						} catch (e) {
							next(e);
						}
					});
				};
			},
		},
	],
});
