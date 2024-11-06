import { defineConfig } from "vite";
import { viteroll } from "../../viteroll";

export default defineConfig({
	root: "./src",
	build: {
		rollupOptions: {
			input: {
				index: "./index.html",
				about: "./about/index.html",
			},
		},
	},
	plugins: [viteroll()],
});
