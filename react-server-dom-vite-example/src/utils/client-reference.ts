export function resolveClientReference(reference: [string]) {
	// console.log("[debug:resolveClientReference]", { reference })
	const [id, name] = reference[0].split("#");
	let mod: Record<string, unknown>;
	return {
		async preload() {
			// console.log("[debug:preload]", { id, name})
			if (import.meta.env.DEV) {
				mod ??= await import(/* @vite-ignore */ id);
			} else {
				const { default: references } = await import(
					"virtual:build-client-references"
				);
				mod ??= await references[id]();
			}
		},
		get() {
			// console.log("[debug:get]", { id, name })
			return mod[name];
		},
	};
}
