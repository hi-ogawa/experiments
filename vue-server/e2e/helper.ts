import fs from "node:fs";
import test, { type Page, expect } from "@playwright/test";

export const testNoJs = test.extend({
	javaScriptEnabled: ({}, use) => use(false),
});

export async function waitForHydration(page: Page) {
	await expect(page.getByText("[mounted: 1]")).toBeVisible();
}

export function createEditor(filepath: string) {
	let init = fs.readFileSync(filepath, "utf-8");
	let data = init;
	return {
		edit(editFn: (data: string) => string) {
			data = editFn(data);
			fs.writeFileSync(filepath, data);
		},
		[Symbol.dispose]() {
			fs.writeFileSync(filepath, init);
		},
	};
}
