import type { ClientReferenceManifest } from "../types";

let requireModule: (id: string) => Promise<any>;

export function setRequireModule(fn: (id: string) => Promise<unknown>) {
	requireModule = fn;
}

// NOTE: this can be hard-coded in react-server-dom-vite
export function getClientReferenceManifest() {
	return clientReferenceManifest;
}

const clientReferenceManifest: ClientReferenceManifest = {
	resolveClientReference(reference: string) {
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
