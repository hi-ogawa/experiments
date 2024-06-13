import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

async function main() {
	// clean
	await rm(".vercel/output", { recursive: true, force: true });
	await mkdir(".vercel/output", { recursive: true });

	// config
	await cp(
		join(import.meta.dirname, "config.json"),
		".vercel/output/config.json",
	);

	// static
	await mkdir(".vercel/output/static", { recursive: true });
	await cp("public", ".vercel/output/static", { recursive: true });

	// function
	await mkdir(".vercel/output/functions/index.func", { recursive: true });
	await cp(
		join(import.meta.dirname, ".vc-config.json"),
		".vercel/output/functions/index.func/.vc-config.json",
	);

	// bundle server
	await esbuild.build({
		entryPoints: ["dist/server/index.js"],
		outfile: ".vercel/output/functions/index.func/index.mjs",
		bundle: true,
		format: "esm",
		platform: "node",
		define: {
			"process.env.NODE_ENV": `"production"`,
		},
		banner: {
			js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
		},
	});
}

main();
