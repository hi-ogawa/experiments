import { type Page, test } from "@playwright/test";
import { createEditor } from "./helper";

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

test("server reference @js", async ({ page }) => {
	await testServerAction(page);
});

test.describe(() => {
	test.use({ javaScriptEnabled: false });
	test("server reference @nojs", async ({ page }) => {
		await testServerAction(page);
	});
});

async function testServerAction(page: Page) {
	await page.goto("/");
	await page.getByText("Server counter: 0").click();
	await page
		.getByTestId("server-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Server counter: 1").click();
	await page.goto("/");
	await page.getByText("Server counter: 1").click();
	await page
		.getByTestId("server-counter")
		.getByRole("button", { name: "-" })
		.click();
	await page.getByText("Server counter: 0").click();
}

test("client hmr @dev", async ({ page }) => {
	await page.goto("/");
	await page.getByText("[hydrated: 1]").click();
	await page.getByText("Client counter: 0").click();
	await page
		.getByTestId("client-counter")
		.getByRole("button", { name: "+" })
		.click();
	await page.getByText("Client counter: 1").click();
	using file = createEditor("src/app/client.tsx");
	file.edit((s) => s.replace("Client counter", "Client [EDIT] counter"));
	await page.getByText("Client [EDIT] counter: 1").click();
});
