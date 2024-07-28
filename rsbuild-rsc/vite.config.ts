import path from "node:path";
import { webToNodeHandler } from "@hiogawa/utils-node";
import { defineConfig } from "vite";

// use vite preview server for local build

export default defineConfig({
	appType: "custom",
	plugins: [
		{
			name: "preview-middleware",
			async configurePreviewServer(server) {
				server.middlewares.use((req, _res, next) => {
					// disable compression entirely since it breaks streaming
					delete req.headers["accept-encoding"];
					next();
				});

				const mod = await import(path.resolve("./dist/ssr/index.cjs"));
				return () => {
					server.middlewares.use(webToNodeHandler(mod.default.default));
				};
			},
		},
	],
	build: {
		outDir: "dist/browser",
	},
});
