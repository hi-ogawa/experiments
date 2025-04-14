import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

const buildDir = join(import.meta.dirname, "../../dist");
const outDir = join(import.meta.dirname, "dist");

async function main() {
	// clean
	await rm(outDir, { recursive: true, force: true });
	await mkdir(outDir, { recursive: true });

	// assets
	await cp(join(buildDir, "browser"), outDir, {
		recursive: true,
	});

	// worker routes
	// https://developers.cloudflare.com/pages/functions/routing/#create-a-_routesjson-file
	await writeFile(
		join(outDir, "_routes.json"),
		JSON.stringify(
			{
				version: 1,
				include: ["/*"],
				exclude: ["/favicon.ico", "/assets/*"],
			},
			null,
			2,
		),
	);

	// headers
	// https://developers.cloudflare.com/pages/configuration/headers/
	await writeFile(
		join(outDir, "_headers"),
		`\
/favicon.ico
  Cache-Control: public, max-age=3600, s-maxage=3600
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
	);

	// worker
	// https://developers.cloudflare.com/pages/functions/advanced-mode/
	await writeFile(
		join(buildDir, "server/__cf.js"),
		`\
import server from "./index.cjs";
export default { fetch: server.handler };
`,
	);
	await esbuild.build({
		entryPoints: [join(buildDir, "server/__cf.js")],
		outfile: join(outDir, "_worker.js"),
		bundle: true,
		minify: true,
		format: "esm",
		platform: "browser",
		logOverride: {
			"ignored-bare-import": "silent",
		},
		external: ["node:async_hooks"],
	});
}

main();
