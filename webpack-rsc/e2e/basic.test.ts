import { type Page, test } from "@playwright/test";
import {
	createEditor,
	createReloadChecker,
	testNoJs,
	waitForHydration,
} from "./helper";

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

test("navigation @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await using _ = await createReloadChecker(page);
	await testNavigation(page);
});

testNoJs("navigation @nojs", async ({ page }) => {
	await page.goto("/");
	await testNavigation(page);
});

async function testNavigation(page: Page) {
	await page.getByRole("link", { name: "Stream" }).click();
	await page.waitForURL("/stream");
	await page.getByRole("heading", { name: "Stream" }).click();
	await page.goBack();
	await page.waitForURL("/");
	await page.getByRole("heading", { name: "Webpack RSC" }).click();
}

test("error @js", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);
	await testError(page);
	await page.getByRole("button", { name: "count is 0" }).click();
	await page.getByRole("button", { name: "count is 1" }).click();
});

testNoJs("error @nojs", async ({ page }) => {
	await page.goto("/");
	await testError(page);
});

async function testError(page: Page) {
	await page.getByRole("link", { name: "Error" }).click();
	await page.waitForURL("/error");
	await page.getByRole("heading", { name: "Something went wrong" }).click();
	await page.getByRole("link", { name: "Home" }).click();
	await page.waitForURL("/");
}

test("action state @js", async ({ page }) => {
	await page.goto("/action");
	await waitForHydration(page);
	await using _ = await createReloadChecker(page);
	await testAction(page);
});

testNoJs("action state @nojs", async ({ page }) => {
	await page.goto("/action");
	await testAction(page);
});

test("inline action @js", async ({ page }) => {
	await page.goto("/action/inline");
	await waitForHydration(page);
	await using _ = await createReloadChecker(page);
	await testAction(page);
});

testNoJs("inline action @nojs", async ({ page }) => {
	await page.goto("/action/inline");
	await testAction(page);
});

async function testAction(page: Page) {
	await page.getByText("Count is 0").click();
	await page.getByRole("button", { name: "+" }).click();
	await page.getByText("Count is 1").click();
	await page.getByRole("button", { name: "-" }).click();
	await page.getByText("Count is 0").click();
}

test("server hmr", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);

	await page.getByRole("heading", { name: "Webpack RSC" }).click();
	await page.getByRole("button", { name: "count is 0" }).click();

	await using _ = await createReloadChecker(page);
	using editor = createEditor("./src/routes/page.tsx");
	editor.edit((s) => s.replace("Webpack RSC", "Webpack [EDIT] RSC"));

	await page.getByRole("heading", { name: "Webpack [EDIT] RSC" }).click();
	await page.getByRole("button", { name: "count is 1" }).click();
});
