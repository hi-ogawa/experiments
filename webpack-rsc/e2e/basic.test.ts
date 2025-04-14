import { createRequire } from "node:module";
import { type Page, expect, test } from "@playwright/test";
import {
	createEditor,
	createReloadChecker,
	testNoJs,
	waitForHydration,
} from "./helper";

const require = createRequire(import.meta.url);

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

test("server hmr @dev", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);

	await page.getByRole("heading", { name: "Webpack RSC" }).click();
	// 0 -> 1
	await page.getByRole("button", { name: "count is 0" }).click();

	await using _ = await createReloadChecker(page);
	using editor = createEditor("./src/routes/page.tsx");
	editor.edit((s) => s.replace("Webpack RSC", "Webpack [EDIT] RSC"));

	await page.getByRole("heading", { name: "Webpack [EDIT] RSC" }).click();
	// 1 -> 2
	await page.getByRole("button", { name: "count is 1" }).click();
});

test("client hmr @dev", async ({ page }) => {
	await page.goto("/");
	await waitForHydration(page);

	// 0 -> 1
	await page.getByRole("button", { name: "count is 0" }).click();

	// for some reason, it full reloas on first edit
	using editor = createEditor("./src/routes/_client.tsx");

	const reloadPromise = page.waitForRequest("/");
	editor.edit((s) => s.replace("count is", "count [EDIT] is"));
	await reloadPromise;
	await waitForHydration(page);
	// 0 -> 1
	await page.getByRole("button", { name: "count [EDIT] is 0" }).click();

	// hmr works on 2nd time
	await using _ = await createReloadChecker(page);
	editor.edit((s) => s.replace("count is", "count [EDIT2] is"));
	// 1 -> 2
	await page.getByRole("button", { name: "count [EDIT2] is 1" }).click();
});

testNoJs("ssr preinit scripts @nojs", async ({ page }) => {
	await page.goto("/");
	const srcs = await Promise.all(
		(await page.locator("head >> script[async]").all()).map((s) =>
			s.getAttribute("src"),
		),
	);
	const refs = require("../dist/server/__client_reference_browser.cjs");
	const chunk: string = refs["src/routes/_client.tsx"].chunks[1];
	expect(srcs).toContain(`/assets/${chunk}`);
});
