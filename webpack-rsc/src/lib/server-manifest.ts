import { tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "../types/react-types";
import type { ReferenceMap } from "./client-manifest";

export async function getServerManifest() {
	const serverRefs: ReferenceMap = require(
		/* webpackIgnore: true */ "./__server_reference.cjs" as string,
	);

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
