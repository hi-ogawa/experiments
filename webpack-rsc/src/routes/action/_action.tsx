"use server";

import { tinyassert } from "@hiogawa/utils";

export let count = 0;

export function changeCount(formData: FormData) {
	const change = Number(formData.get("change"));
	tinyassert(Number.isSafeInteger(change));
	count += change;
}
