import { type Page, test } from "@playwright/test";
import { createReloadChecker, testNoJs, waitForHydration } from "./helper";

test("basic @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await page.getByRole("heading", { name: "Webpack RSC" }).click();
});

testNoJs("basic @nojs", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("heading", { name: "Webpack RSC" }).click();
});

test("stream", async ({ page }) => {
	await page.goto("/stream", { waitUntil: "commit" });
	await page.getByText("Outer").click();
	await page.getByText("Sleeping 1 sec").click();
	await page.getByText("Inner").click();
});

test("client", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await page.getByRole("button", { name: "count is 0" }).click();
	await page.getByRole("button", { name: "count is 1" }).click();
});

test("navigation @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await using _ = await createReloadChecker(page);
	await testNavigation(page);
});

testNoJs("navigation @nojs", async ({ page }) => {
	await page.goto("/");
	await testNavigation(page);
});

async function testNavigation(page: Page) {
	await page.getByRole("link", { name: "Stream" }).click();
	await page.waitForURL("/stream");
	await page.getByRole("heading", { name: "Stream" }).click();
	await page.goBack();
	await page.waitForURL("/");
	await page.getByRole("heading", { name: "Webpack RSC" }).click();
}
