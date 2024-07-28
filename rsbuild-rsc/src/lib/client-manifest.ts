import { tinyassert } from "@hiogawa/utils";
import type {
	BundlerConfig,
	ImportManifestEntry,
	ModuleMap,
	SsrManifest,
} from "../types/react-types";

export type PreliminaryManifest = {
	[resource: string]: {
		id: string;
		chunks: string[];
	};
};

export async function getClientManifest() {
	let browserRefs: PreliminaryManifest;
	let ssrRefs: PreliminaryManifest;

	if (import.meta.env.DEV) {
		const fs = await import("node:fs");
		browserRefs = JSON.parse(
			fs
				.readFileSync("dist/__client_manifest_browser.mjs", "utf-8")
				.slice("export default".length),
		);
		ssrRefs = JSON.parse(
			fs
				.readFileSync("dist/__client_manifest_ssr.mjs", "utf-8")
				.slice("export default".length),
		);
	} else {
		browserRefs = (
			await import(
				/* webpackIgnore: true */ "../__client_manifest_browser.mjs" as string
			)
		).default;
		ssrRefs = (
			await import(
				/* webpackIgnore: true */ "../__client_manifest_ssr.mjs" as string
			)
		).default;
	}

	const browserManifest: BundlerConfig = new Proxy(
		{},
		{
			get(_target, $$id, _receiver) {
				tinyassert(typeof $$id === "string");
				const [resource, name] = $$id.split("#");
				const entry = browserRefs[resource];
				tinyassert(entry, `invalid browser client reference '${resource}'`);
				return {
					id: entry.id,
					name,
					chunks: entry.chunks,
				} satisfies ImportManifestEntry;
			},
		},
	);

	const inverseBrowserRefs = Object.fromEntries(
		Object.entries(browserRefs).map(([k, v]) => [v.id, k]),
	);

	const ssrModuleMap: ModuleMap = new Proxy(
		{},
		{
			get(_target, browserId, _receiver) {
				tinyassert(typeof browserId === "string");
				const resource = inverseBrowserRefs[browserId];
				tinyassert(resource, `invalid ssr client reference '${browserId}'`);
				const entry = ssrRefs[resource];
				tinyassert(entry, `invalid ssr client reference '${resource}'`);
				return new Proxy(
					{},
					{
						get(_target, name, _receiver) {
							tinyassert(typeof name === "string");
							return {
								id: entry.id,
								name,
								chunks: [],
							} satisfies ImportManifestEntry;
						},
					},
				);
			},
		},
	);
	const ssrManifest: SsrManifest = {
		moduleMap: ssrModuleMap,
		moduleLoading: null,
	};

	return { browserManifest, ssrManifest };
}
