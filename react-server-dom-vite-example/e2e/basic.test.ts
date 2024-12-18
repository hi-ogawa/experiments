import { test } from "@playwright/test";

test("client reference", async ({ page }) => {
	await page.goto("/");
	await page.getByText("[hydrated: 1]").click();
	await page.getByText("Client counter: 0").click();
	await page
		.getByTestId("client-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Client counter: 1").click();
	await page.reload();
	await page.getByText("Client counter: 0").click();
});

test("server reference", async ({ page }) => {
	await page.goto("/");
	await page.getByText("Server counter: 0").click();
	await page
		.getByTestId("server-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Server counter: 1").click();
	await page.reload();
	await page.getByText("Server counter: 1").click();
});
