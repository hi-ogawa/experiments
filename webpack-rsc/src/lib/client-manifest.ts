import { tinyassert } from "@hiogawa/utils";
import type {
	BundlerConfig,
	ImportManifestEntry,
	ModuleId,
	ModuleMap,
	SsrManifest,
} from "../types/react-types";

export type ReferenceMap = {
	[resource: string]: {
		id: ModuleId;
		chunks: ModuleId[];
	};
};

export async function getClientManifest() {
	const browserRefs: ReferenceMap = require(
		/* webpackIgnore: true */ "./__client_reference_browser.cjs" as string,
	);
	const ssrRefs: ReferenceMap = require(
		/* webpackIgnore: true */ "./__client_reference_ssr.cjs" as string,
	);

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
		moduleLoading: {
			prefix: "/assets/",
			crossOrigin: null,
		},
	};

	return { browserManifest, ssrManifest };
}
