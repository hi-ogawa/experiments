import { createServer } from "vite";
import { viteroll } from "../../viteroll.ts";

async function main() {
	const server = await createServer({
		root: import.meta.dirname,
		configFile: false,
		environments: {
			ssr: {
				build: {
					rollupOptions: {
						input: "./src/entry-server.js",
					},
				},
			},
		},
		plugins: [viteroll()],
	});
	await server.listen();
	await server.close();
}

main();
