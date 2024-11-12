import { defineConfig } from "vite";
// import { RolldownEnvironment, viteroll } from "../../viteroll";

process.setSourceMapsEnabled(true);

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
	experimental: {
		rolldownDev: { hmr: true, reactRefresh: true },
	},
	plugins: [
		// viteroll({
		// 	reactRefresh: true,
		// }),
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
							const mod = (await (server.environments.ssr as any).import(
								"index",
							)) as any;
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
