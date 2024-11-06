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
					server.middlewares.use((req, res, next) => {
						const url = new URL(req.url ?? "/", "http://localhost");
						if (url.pathname === "/") {
							res.end("todo");
							return;
						}
						next();
					});
				};
			},
		},
	],
});
