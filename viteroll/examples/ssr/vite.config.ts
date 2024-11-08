import { defineConfig } from "vite";
import { RolldownEnvironment, viteroll } from "../../viteroll";

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
					input: {
						index: "./src/entry-server",
					},
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
					const devEnv = server.environments.ssr as RolldownEnvironment;
					server.middlewares.use(async (req, res, next) => {
						try {
							const mod = (await devEnv.import("index")) as any;
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
