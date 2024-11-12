import { defineConfig } from "vite";
// import { viteroll } from "../../viteroll";

export default defineConfig({
	experimental: {
		rolldownDev: { hmr: true, reactRefresh: true },
	},
	plugins: [
		// viteroll({
		// 	reactRefresh: true,
		// }),
	],
});
