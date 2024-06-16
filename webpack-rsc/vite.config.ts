import path from "node:path";
import { webToNodeHandler } from "@hiogawa/utils-node";
import { defineConfig } from "vite";

// borrow vite preview server

export default defineConfig({
	plugins: [
		{
			name: "preview-middleware",
			async configurePreviewServer(server) {
				server.middlewares.use((req, _res, next) => {
					// disable compression for streaming
					delete req.headers["accept-encoding"];
					next();
				});

				const mod = await import(path.resolve("./dist/server/index.cjs"));
				return () => {
					server.middlewares.use(webToNodeHandler(mod.handler));
				};
			},
		},
	],
	build: {
		outDir: "dist/browser",
	},
});
