import type {
	ClientReferenceMetadataManifest,
	ServerReferenceManifest,
} from "../types";

export const serverReferenceManifest: ServerReferenceManifest = {
	resolveServerReference(reference: string) {
		const [id, name] = reference.split("#");
		let resolved: unknown;
		return {
			async preload() {
				let mod: Record<string, unknown>;
				if (import.meta.env.DEV) {
					mod = await import(/* @vite-ignore */ id);
				} else {
					// @ts-ignore
					const references = await import("virtual:vite-rsc/server-references");
					mod = await references.default[id]();
				}
				resolved = mod[name];
			},
			get() {
				return resolved;
			},
		};
	},
};

export const clientReferenceMetadataManifest: ClientReferenceMetadataManifest =
	{
		resolveClientReferenceMetadata(metadata) {
			return metadata.$$id;
		},
	};
