export type ClientReferenceMetadataManifest = {
	resolveClientReferenceMetadata(metadata: { $$id: string }): string;
};

export type ClientReferenceManifest = {
	resolveClientReference(reference: string): {
		preload(): Promise<void>;
		get(): unknown;
	};
};

export type ResolveServerReferenceFn = (reference: string) => {
	preload(): Promise<void>;
	get(): unknown;
};

export type ServerReferenceManifest = {
	resolveServerReference: ResolveServerReferenceFn;
};

export type CallServerFn = (id: string, args: unknown[]) => unknown;
