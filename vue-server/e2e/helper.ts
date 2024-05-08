import test, { type Page, expect } from "@playwright/test";

export const testNoJs = test.extend({
	javaScriptEnabled: ({}, use) => use(false),
});

export async function waitForHydration(page: Page) {
	await expect(page.getByText("[mounted: 1]")).toBeVisible();
}
