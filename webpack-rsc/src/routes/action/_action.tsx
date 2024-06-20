"use server";

import { tinyassert } from "@hiogawa/utils";

export let count = 0;

export async function changeCount(_: unknown, formData: FormData) {
	await new Promise((r) => setTimeout(r, 500));
	const change = Number(formData.get("change"));
	tinyassert(Number.isSafeInteger(change));
	count += change;
	return { count, change };
}
