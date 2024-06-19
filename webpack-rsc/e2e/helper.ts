import test, { type Page, expect } from "@playwright/test";

export const testNoJs = test.extend({
	javaScriptEnabled: ({}, use) => use(false),
});

export async function waitForHydration(page: Page) {
	await expect(page.locator(`meta[name="x-hydrated"]`)).toHaveAttribute(
		"data-hydrated",
		"true",
	);
}

export async function createReloadChecker(page: Page) {
	// inject custom meta
	await page.evaluate(() => {
		const el = document.createElement("meta");
		el.setAttribute("name", "x-reload-check");
		document.head.append(el);
	});

	return {
		[Symbol.asyncDispose]: async () => {
			// check if meta is preserved
			await expect(page.locator(`meta[name="x-reload-check"]`)).toBeAttached({
				timeout: 1,
			});
		},
	};
}
