import path from "node:path";
import {
	vitePluginLogger,
	vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import { defineConfig } from "vite";
import fs from "node:fs";

export default defineConfig((env) => ({
	clearScreen: false,
	plugins: [
		vitePluginLogger(),
		vitePluginSsrMiddleware({
			entry: "/src/entry-server.tsx",
			preview: path.resolve("./dist/server/index.js"),
		}),
		{
			name: "ppr:build",
			apply: "build",
			async closeBundle() {
				const entry: typeof import("./src/entry-server") = await import(
					path.resolve("./dist/server/index.js")
				);
				const { prelude, postponed } = await entry.prerender(
					new Request("https://ppr.local"),
				);
				const preludeHtml = await streamToString(prelude);
				let code = await fs.promises.readFile("dist/server/index.js", "utf-8");
				code = code.replace(
					"__PPR_BUILD__",
					JSON.stringify({ preludeHtml, postponed }),
				);
				await fs.promises.writeFile("dist/server/index.js", code);
			},
		},
	],
	build: {
		outDir: env.isSsrBuild ? "dist/server" : "dist/client",
	},
}));

async function streamToString(stream: ReadableStream<Uint8Array>) {
	let s = "";
	await stream.pipeThrough(new TextDecoderStream()).pipeTo(
		new WritableStream({
			write(c) {
				s += c;
			},
		}),
	);
	return s;
}
