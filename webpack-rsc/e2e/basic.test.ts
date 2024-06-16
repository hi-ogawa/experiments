import { test } from "@playwright/test";
import { testNoJs, waitForHydration } from "./helper";

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
