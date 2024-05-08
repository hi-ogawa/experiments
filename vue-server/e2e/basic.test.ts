import { type Page, expect, test } from "@playwright/test";
import { testNoJs, waitForHydration } from "./helper";

test("basic @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await page.getByRole("heading", { name: "Vue Server Component" }).click();
	await page.getByText("typeof window = undefined").click();
	await page.getByText("Count: 0").click();
	await page.getByRole("button", { name: "+" }).click();
	await page.getByText("Count: 1").click();
	await page.getByRole("button", { name: "-" }).click();
	await page.getByText("Count: 0").click();
});

testNoJs("basic @nojs", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("heading", { name: "Vue Server Component" }).click();
	await page.getByText("typeof window = undefined").click();
	await page.getByText("Count: 0").click();
});

test("navigation @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await testNavigation(page, { js: true });
});

testNoJs("navigation @nojs", async ({ page }) => {
	await page.goto("/");
	await testNavigation(page, { js: false });
});

async function testNavigation(page: Page, options: { js: boolean }) {
	await page.getByPlaceholder("(test)").fill("hello");
	await page.getByRole("link", { name: "SFC" }).click();
	await page.waitForURL("/sfc");
	await page.getByRole("heading", { name: "Server SFC" }).click();
	await page.getByRole("button", { name: "client sfc: 0" }).click();
	if (options.js) {
		await page.getByRole("button", { name: "client sfc: 1" }).click();
	}
	await expect(page.getByPlaceholder("(test)")).toHaveValue(
		options.js ? "hello" : "",
	);
}
