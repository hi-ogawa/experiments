import { defineConfig } from "vite";
import { viteroll } from "../../viteroll";

export default defineConfig({
	define: {
		"process.env.NODE_ENV": "'development'",
	},
	plugins: [viteroll()],
});
