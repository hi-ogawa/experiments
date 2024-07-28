import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

const buildDir = join(import.meta.dirname, "../../dist");
const outDir = join(import.meta.dirname, "../../.vercel/output");

const configJson = {
	version: 3,
	trailingSlash: false,
	routes: [
		{
			src: "^/static/(.*)$",
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
};

const vcConfigJson = {
	runtime: "edge",
	entrypoint: "index.js",
};

async function main() {
	// clean
	await rm(outDir, { recursive: true, force: true });
	await mkdir(outDir, { recursive: true });

	// config
	await writeFile(
		join(outDir, "config.json"),
		JSON.stringify(configJson, null, 2),
	);

	// static
	await mkdir(join(outDir, "static"), { recursive: true });
	await cp(join(buildDir, "browser"), join(outDir, "static"), {
		recursive: true,
	});
	await rm(join(outDir, "static/index.html"));
	await rm(join(outDir, "static/report-web.html"));
	await rm(join(outDir, "static/stats.json"));

	// function
	await mkdir(join(outDir, "functions/index.func"), { recursive: true });
	await writeFile(
		join(outDir, "functions/index.func/.vc-config.json"),
		JSON.stringify(vcConfigJson, null, 2),
	);

	// bundle function
	await esbuild.build({
		entryPoints: [join(import.meta.dirname, "entry.js")],
		outfile: join(outDir, "functions/index.func/index.js"),
		bundle: true,
		format: "esm",
		platform: "browser",
	});
}

main();
