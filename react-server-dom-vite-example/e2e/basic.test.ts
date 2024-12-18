import { test } from "@playwright/test";

test("basic", async ({ page }) => {
	await page.goto("/");
	await page.getByText("[hydrated: 1]").click();
	await page.getByText("Count is 0").click();
	await page.getByRole("button", { name: "+" }).click();
	await page.getByText("Count is 1").click();
});
