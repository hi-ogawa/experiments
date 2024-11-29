import { expect, test } from "@playwright/test";
import { createEditor, testNoJs } from "../../../e2e/helper";

testNoJs("ssr", async ({ page }) => {
	await page.goto("/");
	await page.getByText("hydrated: false").click();
});

test("csr", async ({ page }) => {
	await page.goto("/");
	await page.getByText("hydrated: true").click();
});

test("hmr", async ({ page, request }) => {
	await page.goto("/");
	await page.getByText("hydrated: true").click();

	await page.getByRole("button", { name: "Count: 0" }).click();

	using file = createEditor("./src/app.tsx");
	file.edit((s) => s.replace("Count:", "Count-EDIT:"));

	await page.getByRole("button", { name: "Count-EDIT: 1" }).click();

	file.edit((s) => s.replace("Count-EDIT:", "Count-EDIT-EDIT:"));
	await page.getByRole("button", { name: "Count-EDIT-EDIT: 2" }).click();

	// server module is also invalidated
	const res = await request.get("/");
	expect(await res.text()).toContain("Count-EDIT-EDIT");
});

test("server stacktrace", async ({ page }) => {
	const res = await page.goto("/crash-ssr");
	expect(await res?.text()).toContain("examples/ssr/src/error.tsx:8:8");
	expect(res?.status()).toBe(500);
});
