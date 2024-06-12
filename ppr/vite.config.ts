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
			entry: "/src/adapters/node",
			preview: path.resolve("./dist/server/index.js"),
		}),
		{
			name: "ppr:build",
			apply: "build",
			config() {
				return {
					build: {
						rollupOptions: {
							input: {
								__entry: "/src/entry-server",
							},
						},
					},
				};
			},
			async closeBundle() {
				const entry: typeof import("./src/entry-server") = await import(
					path.resolve("./dist/server/__entry.js")
				);
				const { prelude, postponed } = await entry.prerender(
					new Request("https://ppr.local"),
				);
				const preludeHtml = await streamToString(prelude);
				await editFile("dist/server/__entry.js", (code) =>
					code.replace(
						"__PPR_BUILD__",
						JSON.stringify({ preludeHtml, postponed }),
					),
				);
			},
		},
	],
	build: {
		outDir: env.isSsrBuild ? "dist/server" : "dist/client",
	},
}));

async function editFile(filepath: string, edit: (v: string) => string) {
	let code = await fs.promises.readFile(filepath, "utf-8");
	await fs.promises.writeFile(filepath, edit(code));
}

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
