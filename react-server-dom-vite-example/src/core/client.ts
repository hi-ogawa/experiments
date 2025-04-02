import type { ClientReferenceManifest } from "../types";

export const clientReferenceManifest: ClientReferenceManifest = {
	resolveClientReference(reference: string) {
		const [id, name] = reference.split("#");
		let resolved: unknown;
		return {
			async preload() {
				let mod: Record<string, unknown>;
				if (import.meta.env.DEV) {
					// TODO: this one can still break module identity due to `?import`
					// TODO: also in practice, this `id` needs same normalization as vite's import analaysis.
					// TODO: after doing all that, there are still issues related to external dependency and optimize deps.
					// should such "feature" land on Vite level or worked around as Core plugin?
					mod = await import(/* @vite-ignore */ id);
				} else {
					// @ts-ignore
					const references = await import("virtual:vite-rsc/client-references");
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
