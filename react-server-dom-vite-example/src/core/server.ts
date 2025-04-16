import type {
	ClientReferenceMetadataManifest,
	ServerReferenceManifest,
} from "../types";

let requireModule: (id: string) => Promise<any>;

export function setRequireModule(fn: (id: string) => Promise<unknown>) {
	requireModule = fn;
}

export async function loadServerAction(id: string) {
	const [id2, name] = id.split("#");
	const mod: any = await requireModule(id2);
	return mod[name];
}

// NOTE: this can be hard-coded in react-server-dom-vite
export function getServerReferenceManifest() {
	return serverReferenceManifest;
}

const serverReferenceManifest: ServerReferenceManifest = {
	resolveServerReference(reference: string) {
		const [id, name] = reference.split("#");
		let resolved: unknown;
		return {
			async preload() {
				const mod = await requireModule(id);
				resolved = mod[name];
			},
			get() {
				return resolved;
			},
		};
	},
};

// NOTE: this can be hard-coded in react-server-dom-vite
export const clientReferenceMetadataManifest: ClientReferenceMetadataManifest =
	{
		resolveClientReferenceMetadata(metadata) {
			return metadata.$$id;
		},
	};
