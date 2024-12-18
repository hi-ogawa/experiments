import { type RunnableDevEnvironment, defineConfig } from "vite";

export default defineConfig({
	appType: "custom",
	environments: {
		client: {},
		ssr: {},
		rsc: {},
	},
	plugins: [
		{
			name: "ssr-middleware",
			configureServer(server) {
				const runner = (server.environments.ssr as RunnableDevEnvironment)
					.runner;
				server.middlewares.use(async (req, res, next) => {
					try {
						const mod: typeof import("./src/entry.ssr") =
							await runner.import("/src/entry.ssr.tsx");
						await mod.default(req, res);
					} catch (e) {
						next(e);
					}
				});
			},
		},
	],
});
