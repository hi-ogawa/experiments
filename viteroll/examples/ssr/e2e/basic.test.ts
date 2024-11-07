import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
	const res = await page.goto("/");
	expect(await res?.text()).toContain("Rolldown SSR");
	await page.getByRole("heading", { name: "Rolldown SSR" }).click();
	await page.getByText("Rendered by JS").click();
});
