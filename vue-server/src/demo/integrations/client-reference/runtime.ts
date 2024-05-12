import type { ReferenceMap } from "../../../serialize";

export async function createReferenceMap(ids: string[]): Promise<ReferenceMap> {
	return Object.fromEntries(
		await Promise.all(ids.map(async (id) => [id, await resolveReference(id)])),
	);
}

async function resolveReference(id: string) {
	const [file, name] = id.split("#");
	let mod: any;
	if (import.meta.env.DEV) {
		mod = await import(/* @vite-ignore */ file);
	} else {
		const mods = await import("virtual:client-references" as string);
		mod = await mods.default[file]();
	}
	return mod[name];
}
