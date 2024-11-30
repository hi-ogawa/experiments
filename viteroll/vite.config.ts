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
						// TODO: \0 not available in chunk.modules https://github.com/rolldown/rolldown/issues/1115
						return `\tvirtual:test`;
					}
				},
			},
			load: {
				filter: {
					id: {
						include: ["\tvirtual:test"],
					},
				},
				handler(id) {
					if (id === "\tvirtual:test") {
						return `export default "ok"`;
					}
				},
			},
		} satisfies rolldown.Plugin as any as Plugin,
	],
});
