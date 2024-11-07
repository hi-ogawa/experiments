import fs from "node:fs";
import test from "@playwright/test";

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

export const testNoJs = test.extend({
	javaScriptEnabled: ({}, use) => use(false),
});
