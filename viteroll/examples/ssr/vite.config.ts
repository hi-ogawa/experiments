import { defineConfig } from "vite";
import { viteroll } from "../../viteroll";

export default defineConfig({
	build: {
		rollupOptions: {
			input: "./src/entry.js",
		},
	},
	plugins: [
		viteroll(),
		{
			name: "ssr",
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
