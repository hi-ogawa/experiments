import { type Page, expect, test } from "@playwright/test";
import { testNoJs, waitForHydration } from "./helper";

test("basic @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await page.getByText("Welcome Home!").click();
	await page.getByText("Count: 0").click();
	await page.getByRole("button", { name: "+" }).click();
	await page.getByText("Count: 1").click();
	await page.getByRole("button", { name: "-" }).click();
	await page.getByText("Count: 0").click();
});

testNoJs("basic @nojs", async ({ page }) => {
	await page.goto("/");
	await page.getByText("Welcome Home!").click();
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
	await page.getByPlaceholder("(test-input)").fill("hello");
	await page.getByRole("link", { name: "Client Link!" }).click();
	await page.waitForURL("/posts");
	await page.getByText("Select a post.").click();
	await page.getByRole("link", { name: "qui est esse" }).click();
	await page.waitForURL("/posts/2");
	await page.getByText("est rerum tempore vitae sequi").click();
	await expect(page.getByPlaceholder("(test-input)")).toHaveValue(
		options.js ? "hello" : "",
	);
}
