export type ResolveClientReferenceMetadataFn = (metadata: { $$id: string }) => [
	string,
];

export type ResolveClientReferenceFn = (reference: [string]) => {
	preload(): Promise<void>;
	get(): unknown;
};

export type ResolveServerReferenceFn = (reference: string) => {
	preload(): Promise<void>;
	get(): unknown;
};

export type ServerReferenceManifest = {
	resolveServerReference: ResolveServerReferenceFn
}

export type CallServerFn = (id: string, args: unknown[]) => unknown;
