import { defineConfig } from "vite";
import { viteroll } from "../../viteroll";

export default defineConfig({
	plugins: [
		viteroll({
			reactRefresh: true,
		}),
	],
});
