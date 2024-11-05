import { test } from "@playwright/test";
import { createEditor } from "./helper";

test("basic", async ({ page }) => {
	page.on("pageerror", (error) => {
		console.log(error);
	});

	await page.goto("/");

	await page.getByRole("heading", { name: "Test" }).click();
	await page.getByText("[define] ok").click();
	await page.getByText("[virtual:test] ok").click();

	await page.getByRole("button", { name: "Count: 0" }).click();
	await page.getByRole("button", { name: "Count: 1" }).click();
});

test("reload", async ({ page }) => {
	await page.goto("/");

	await page.getByRole("heading", { name: "Test" }).click();
	await page.getByRole("button", { name: "Count: 0" }).click();
	await page.getByRole("button", { name: "Count: 1" }).click();

	using file = createEditor("./src/index.ts");
	file.edit((s) => s.replace('h("h3", {}, "Test")', 'h("h3", {}, "Teditst")'));

	await page.getByRole("heading", { name: "Teditst" }).click();
	await page.getByRole("button", { name: "Count: 0" }).click();
});

test("hmr", async ({ page }) => {
	await page.goto("/");

	await page.getByText("[dep-hmr.ts] Edit me!").click();
	await page.getByRole("button", { name: "Count: 0" }).click();

	using file = createEditor("./src/dep-hmr.ts");
	file.edit((s) => s.replace("Edit me!", "Edit foo!"));

	await page.getByText("[dep-hmr.ts] Edit foo!").click();
	await page.getByRole("button", { name: "Count: 1" }).click();

	file.edit((s) => s.replace("Edit foo!", "Edit bar!"));
	await page.getByText("[dep-hmr.ts] Edit bar!").click();
	await page.getByRole("button", { name: "Count: 2" }).click();
});
