import { createServer } from "vite";
import { viteroll } from "../../viteroll.ts";

async function main() {
	const server = await createServer({
		root: import.meta.dirname,
		configFile: false,
		build: {
			rollupOptions: {
				input: "./src/entry.js",
			},
		},
		plugins: [viteroll()],
	});
	await server.listen();
	await server.close();
}

main();
