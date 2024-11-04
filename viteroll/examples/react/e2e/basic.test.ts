import { test } from "@playwright/test";
import { createEditor } from "../../../e2e/helper";

test("basic", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Count: 0" }).click();
	await page.getByRole("button", { name: "Count: 1" }).click();
});

test("reload", async ({ page }) => {
	await page.goto("/");

	await page.getByRole("button", { name: "Count: 0" }).click();
	await page.getByRole("button", { name: "Count: 1" }).click();

	using file = createEditor("./src/main.tsx");
	file.edit((s) =>
		s.replace("<StrictMode>", "<StrictMode><h1>edit-and-reload</h1>"),
	);

	await page.getByRole("heading", { name: "edit-and-reload" }).click();
	await page.getByRole("button", { name: "Count: 0" }).click();
	await page.getByRole("button", { name: "Count: 1" }).click();
});

test("hmr", async ({ page }) => {
	await page.goto("/");

	await page.getByRole("button", { name: "Count: 0" }).click();

	using file = createEditor("./src/App.tsx");
	file.edit((s) => s.replace("Count:", "Count-EDIT:"));

	await page.getByRole("button", { name: "Count-EDIT: 1" }).click();

	file.edit((s) => s.replace("Count-EDIT:", "Count-EDIT-EDIT:"));
	await page.getByRole("button", { name: "Count-EDIT-EDIT: 2" }).click();
});
