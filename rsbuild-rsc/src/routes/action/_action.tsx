"use server";

export let count = 0;

export async function changeCount(_: unknown, formData: FormData) {
	await new Promise((r) => setTimeout(r, 500));
	const change = Number(formData.get("change"));
	count += change;
	return { count, change };
}
