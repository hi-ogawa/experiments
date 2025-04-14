import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

const buildDir = join(import.meta.dirname, "../../dist");
const outDir = join(import.meta.dirname, ".vercel/output");

async function main() {
	// clean
	await rm(outDir, { recursive: true, force: true });
	await mkdir(outDir, { recursive: true });

	// config
	await writeFile(
		join(outDir, "config.json"),
		JSON.stringify(
			{
				version: 3,
				trailingSlash: false,
				routes: [
					{
						src: "^/assets/(.*)$",
						headers: {
							"cache-control": "public, immutable, max-age=31536000",
						},
					},
					{
						handle: "filesystem",
					},
					{
						src: ".*",
						dest: "/",
					},
				],
			},
			null,
			2,
		),
	);

	// static
	await mkdir(join(outDir, "static"), { recursive: true });
	await cp(join(buildDir, "browser"), join(outDir, "static"), {
		recursive: true,
	});

	// function
	await mkdir(join(outDir, "functions/index.func"), { recursive: true });
	await writeFile(
		join(outDir, "functions/index.func/.vc-config.json"),
		JSON.stringify(
			{
				runtime: "edge",
				entrypoint: "index.js",
			},
			null,
			2,
		),
	);
	await writeFile(
		join(buildDir, "server/__vercel_edge.js"),
		`\
import server from "./index.cjs";
export default server.handler;
`,
	);
	await esbuild.build({
		entryPoints: [join(buildDir, "server/__vercel_edge.js")],
		outfile: join(outDir, "functions/index.func/index.js"),
		bundle: true,
		minify: true,
		format: "esm",
		platform: "browser",
		logOverride: {
			"ignored-bare-import": "silent",
		},
		external: ["node:async_hooks"],
		banner: {
			js: `\
import { AsyncLocalStorage } from "node:async_hooks";
Object.assign(globalThis, { AsyncLocalStorage });
`
		},
	});
}

main();
