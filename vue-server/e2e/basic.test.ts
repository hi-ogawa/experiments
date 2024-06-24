import { type Page, expect, test } from "@playwright/test";
import { createEditor, testNoJs, waitForHydration } from "./helper";

test("basic @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await page.getByRole("heading", { name: "Vue Server Component" }).click();
	await page.getByText("typeof window = undefined").click();
	await page.getByText("Count: 0").click();
	await page.getByRole("button", { name: "+" }).click();
	await page.getByText("Count: 1").click();
	await page.getByRole("button", { name: "-" }).click();
	await page.getByText("Count: 0").click();
});

testNoJs("basic @nojs", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("heading", { name: "Vue Server Component" }).click();
	await page.getByText("typeof window = undefined").click();
	await page.getByText("Count: 0").click();
});

test("ssr", async ({ request }) => {
	const res = await request.get("/");
	const resText = await res.text();
	expect(resText).toMatch(
		/^<!DOCTYPE html>\s*<html>\s*<head>.*<\/head>\s*<body>.*<\/body>\s*<\/html>\s*$/s,
	);
});

test("navigation @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await testNavigation(page, { js: true });
});

testNoJs("navigation @nojs", async ({ page }) => {
	await page.goto("/");
	await testNavigation(page, { js: false });
});

async function testNavigation(page: Page, options: { js: boolean }) {
	await page.getByPlaceholder("(test)").fill("hello");
	await page.getByRole("link", { name: "SFC" }).click();
	await page.waitForURL("/sfc");
	await page.getByRole("heading", { name: "Server SFC" }).click();
	await page.getByRole("button", { name: "client counter 0" }).first().click();
	if (options.js) {
		await page
			.getByRole("button", { name: "client counter 1" })
			.first()
			.click();
	}
	await expect(page.getByPlaceholder("(test)")).toHaveValue(
		options.js ? "hello" : "",
	);
}

test("highlight @js", async ({ page }) => {
	await page.goto("/highlight");
	await waitForHydration(page);
	await expect(page.locator("pre.shiki")).toBeVisible();
});

testNoJs("highlight @nojs", async ({ page }) => {
	await page.goto("/highlight");
	await expect(page.locator("pre.shiki")).toBeVisible();
});

test("form navigation @js", async ({ page }) => {
	await page.goto("/highlight");
	await waitForHydration(page);
	await testFormNavigation(page, { js: true });
});

testNoJs("form navigation @nojs", async ({ page }) => {
	await page.goto("/highlight");
	await testFormNavigation(page, { js: false });
});

async function testFormNavigation(page: Page, options: { js: boolean }) {
	await page.getByPlaceholder("(test)").fill("hello");
	const code = `<script setup>console.log("hello")</script>`;
	await page.locator('textarea[name="code"]').fill(code);
	await page.getByRole("button", { name: "Submit" }).click();
	await page.waitForURL((url) => url.searchParams.get("code") === code);
	await expect(page.getByPlaceholder("(test)")).toHaveValue(
		options.js ? "hello" : "",
	);
}

test("hmr server @dev", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);

	// check client state is preserved
	await page.getByRole("button", { name: "client sfc: 0" }).click();
	await page.getByRole("button", { name: "client sfc: 1" }).isVisible();
	await page.getByRole("heading", { name: "Vue Server Component" }).click();

	using file = createEditor("src/demo/routes/layout.tsx");
	file.edit((s) =>
		s.replace("Vue Server Component", "Vue [EDIT] Server Component"),
	);

	await page
		.getByRole("heading", { name: "Vue [EDIT] Server Component" })
		.click();
	await page.getByRole("button", { name: "client sfc: 1" }).isVisible();

	await page.reload();
	await page
		.getByRole("heading", { name: "Vue [EDIT] Server Component" })
		.click();
	await page.getByRole("button", { name: "client sfc: 0" }).isVisible();
});

test("hmr sfc @dev", async ({ page }) => {
	await page.goto("/sfc");
	await waitForHydration(page);

	await page.getByRole("button", { name: "client counter 0" }).first().click();
	await page.getByRole("button", { name: "client counter 1" }).click();
	await page.getByRole("button", { name: "client counter 2" }).isVisible();
	await expect(page.getByText("server random")).toHaveCount(2);

	using clientFile = createEditor("src/demo/routes/_slot.vue");
	clientFile.edit((s) => s.replace("client counter", "client [EDIT] counter"));
	await page
		.getByRole("button", { name: "client [EDIT] counter 2" })
		.isVisible();
	await page
		.getByRole("button", { name: "client [EDIT] counter 0" })
		.isVisible();

	using serverFile = createEditor("src/demo/routes/_slot.server.vue");
	serverFile.edit((s) => s.replace("server random", "server [EDIT] random"));
	await expect(page.getByText("server [EDIT] random")).toHaveCount(2);
	await page
		.getByRole("button", { name: "client [EDIT] counter 2" })
		.isVisible();
	await page
		.getByRole("button", { name: "client [EDIT] counter 0" })
		.isVisible();
});
