import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 6174);
const command = `pnpm dev --port ${port} --strict-port`;

export default defineConfig({
	testDir: "e2e",
	use: {
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: null,
				deviceScaleFactor: undefined,
			},
		},
	],
	timeout: 10_000,
	webServer: {
		command,
		port,
		stdout: "pipe",
		stderr: "pipe",
	},
	forbidOnly: !!process.env["CI"],
	retries: process.env["CI"] ? 2 : 0,
	reporter: "list",
});
