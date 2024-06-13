import { test } from "@playwright/test";

test("ssr", async ({ page }) => {
	await page.goto("/", { waitUntil: "commit" });
	await page.getByRole("heading", { name: "Static" }).click();
	await page.getByText("Sleeping 1 sec").click();
	await page.getByRole("heading", { name: "Dynamic 1" }).click();
	await page.getByText("Sleeping 2 sec").click();
	await page.getByRole("heading", { name: "Dynamic 2" }).click();
});

test("prerender and resume", async ({ page }) => {
	await page.goto("/?prerender&resume", { waitUntil: "commit" });
	await page.getByRole("heading", { name: "Static" }).click();
	await page.getByText("Sleeping 1 sec").click();
	await page.getByRole("heading", { name: "Dynamic 1" }).click();
	await page.getByText("Sleeping 2 sec").click();
	await page.getByRole("heading", { name: "Dynamic 2" }).click();
});

test("ppr @build", async ({ page }) => {
	await page.goto("/?ppr", { waitUntil: "commit" });
	await page.getByRole("heading", { name: "Static" }).click();
	await page.getByText("Sleeping 1 sec").click();
	await page.getByRole("heading", { name: "Dynamic 1" }).click();
	await page.getByText("Sleeping 2 sec").click();
	await page.getByRole("heading", { name: "Dynamic 2" }).click();
});
