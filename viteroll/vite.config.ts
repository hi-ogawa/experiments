import * as rolldown from "rolldown";
import { type Plugin, defineConfig } from "vite";
import { viteroll } from "./viteroll";

export default defineConfig({
	clearScreen: false,
	define: {
		__TEST_DEFINE__: `"ok"`,
	},
	resolve: {
		alias: {},
	},
	plugins: [
		viteroll(),
		{
			name: "test-virtual",
			resolveId: {
				filter: {
					id: {
						include: ["virtual:test"],
					},
				},
				handler(source) {
					if (source === "virtual:test") {
						return `\0virtual:test`;
					}
				},
			},
			load: {
				filter: {
					id: {
						include: ["\0virtual:test"],
					},
				},
				handler(id) {
					if (id === "\0virtual:test") {
						return `export default "ok"`;
					}
				},
			},
		} satisfies rolldown.Plugin as Plugin,
	],
});
