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

test("stream", async ({ page }) => {
	await page.goto("/stream", { waitUntil: "commit" });
	await page.getByText("Outer").click();
	await page.getByText("Sleeping 1 sec").click();
	await page.getByText("Inner").click();
});
