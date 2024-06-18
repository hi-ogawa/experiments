export type ModuleId = string | number;

export interface ImportManifestEntry {
	id: ModuleId;
	name: string;
	chunks: ModuleId[];
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
