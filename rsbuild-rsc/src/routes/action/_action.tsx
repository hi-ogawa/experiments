"use server";

// TODO:
// counter is borken during dev.
// maybe this module is duplicated and there is no "identical" `count` state?
let count = 0;

export function getCount() {
	return count;
}

export async function changeCount(_: unknown, formData: FormData) {
	await new Promise((r) => setTimeout(r, 500));
	const change = Number(formData.get("change"));
	count += change;
	return { count, change };
}
