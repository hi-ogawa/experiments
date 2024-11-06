import { test } from "@playwright/test";

test("basic", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("heading", { name: "Home" }).click();
	await page.getByText("Rendered by JS").click();
	await page.getByRole("link", { name: "About" }).click();
	await page.waitForURL("/about");
	await page.getByRole("heading", { name: "About" }).click();
});
