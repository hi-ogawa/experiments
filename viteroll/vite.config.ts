import * as rolldown from "rolldown";
import { type Plugin, defineConfig } from "vite";

export default defineConfig({
	clearScreen: false,
	optimizeDeps: {
		noDiscovery: true,
	},
	plugins: [viteroll()],
});

function viteroll(): Plugin {
	let rolldownBuild: rolldown.RolldownBuild;

	return {
		name: viteroll.name,
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				req;
				next;
				res.end(`hello`);
			});
		},
		async buildStart() {
			rolldownBuild = await rolldown.rolldown({});
		},
		async buildEnd() {
			await rolldownBuild.close();
		},
	};
}
