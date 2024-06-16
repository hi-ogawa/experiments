import { test } from "@playwright/test";
import { testNoJs } from "./helper";

test("basic @js", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("heading", { name: "Webpack RSC" }).click();
});

testNoJs("basic @nojs", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("heading", { name: "Webpack RSC" }).click();
});
