import path from "node:path";
import { webToNodeHandler } from "@hiogawa/utils-node";
import { defineConfig } from "vite";

// use vite preview server for local build

export default defineConfig({
	plugins: [
		{
			name: "preview-middleware",
			async configurePreviewServer(server) {
				const mod = await import(path.resolve("./dist/server/index.cjs"));
				return () => {
					server.middlewares.use(webToNodeHandler(mod.default.default));
				};
			},
		},
	],
	build: {
		outDir: "dist/client",
	},
});
