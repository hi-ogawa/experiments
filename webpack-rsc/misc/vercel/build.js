import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

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
	await cp("dist/browser", ".vercel/output/static", { recursive: true });

	// function
	await mkdir(".vercel/output/functions/index.func", { recursive: true });
	await cp("dist/server", ".vercel/output/functions/index.func", {
		recursive: true,
	});
	await cp(
		join(import.meta.dirname, ".vc-config.json"),
		".vercel/output/functions/index.func/.vc-config.json",
	);
	await cp(
		join(import.meta.dirname, "entry.mjs"),
		".vercel/output/functions/index.func/entry.mjs",
	);
}

main();
