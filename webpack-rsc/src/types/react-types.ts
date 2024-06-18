export interface ImportManifestEntry {
	id: string;
	name: string;
	chunks: string[];
}

export interface BundlerConfig {
	[$$id: string]: ImportManifestEntry;
}

export type ModuleMap = {
	[id: string]: {
		[exportName: string]: ImportManifestEntry;
	};
};

export interface SsrManifest {
	moduleMap: ModuleMap;
	moduleLoading?: unknown;
}
