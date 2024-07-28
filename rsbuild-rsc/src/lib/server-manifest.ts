import { tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "../types/react-types";
import type { PreliminaryManifest } from "./client-manifest";

export async function getServerManifest() {
	let serverRefs: PreliminaryManifest;

	if (import.meta.env.DEV) {
		const fs = await import("node:fs");
		serverRefs = JSON.parse(
			fs
				.readFileSync("dist/__server_manifest.mjs", "utf-8")
				.slice("export default".length),
		);
	} else {
		serverRefs = (
			await import(
				/* webpackIgnore: true */ "../__server_manifest.mjs" as string
			)
		).default;
	}

	const serverManifest: BundlerConfig = new Proxy(
		{},
		{
			get(_target, $$id, _receiver) {
				tinyassert(typeof $$id === "string");
				const [resource, name] = $$id.split("#");
				const entry = serverRefs[resource];
				tinyassert(entry, `invalid server reference '${resource}'`);
				return {
					id: entry.id,
					name,
					chunks: [],
				} satisfies ImportManifestEntry;
			},
		},
	);

	return { serverManifest };
}
