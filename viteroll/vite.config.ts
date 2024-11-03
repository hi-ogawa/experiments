import assert from "node:assert";
import MagicString from "magic-string";
import * as rolldown from "rolldown";
import * as rolldownExperimental from "rolldown/experimental";
import sirv from "sirv";
import {
	type Plugin,
	type ResolvedConfig,
	type ViteDevServer,
	createLogger,
	defineConfig,
	loadConfigFromFile,
} from "vite";

export default defineConfig({
	clearScreen: false,
	define: {
		__TEST_DEFINE__: `"ok"`,
	},
	resolve: {
		alias: {},
	},
	plugins: [
		{
			name: "test-virtual",
			resolveId: {
				filter: {
					id: {
						include: ["virtual:test"],
					},
				},
				handler(source) {
					if (source === "virtual:test") {
						return `\0virtual:test`;
					}
				},
			},
			load: {
				filter: {
					id: {
						include: ["\0virtual:test"],
					},
				},
				handler(id) {
					if (id === "\0virtual:test") {
						return `export default "ok"`;
					}
				},
			},
		} satisfies rolldown.Plugin as Plugin,
		viteroll(),
	],
});

function viteroll(): Plugin {
	let rolldownBuild: rolldown.RolldownBuild;
	let rolldownOutput: rolldown.RolldownOutput;
	let server: ViteDevServer;
	let config: ResolvedConfig;

	const logger = createLogger("info", {
		prefix: "[rolldown]",
		allowClearScreen: false,
	});

	async function fullBuild() {
		if (rolldownBuild) {
			await rolldownBuild?.close();
		}

		// load fresh user plugins
		assert(config.configFile);
		const loaded = await loadConfigFromFile(
			{ command: "serve", mode: "development" },
			config.configFile,
			config.root,
		);
		assert(loaded);
		const plugins = loaded.config.plugins?.filter(
			(v) => v && "name" in v && v.name !== viteroll.name,
		);

		console.time("[rolldown:build]");
		rolldownBuild = await rolldown.rolldown({
			dev: true,
			// TODO: reuse config.build.rollupOptions.input
			input: {
				index: "./index.html",
			},
			cwd: config.root,
			platform: "browser",
			resolve: {
				conditionNames: config.resolve.conditions,
				mainFields: config.resolve.mainFields,
				symlinks: config.resolve.preserveSymlinks,
			},
			define: config.define,
			plugins: [
				// TODO: not necessary?
				// rolldownExperimental.transformPlugin(),
				// rolldownExperimental.replacePlugin(config.define),
				rolldownExperimental.aliasPlugin({
					entries: config.resolve.alias,
				}),
				viterollEntryPlugin(),
				...(plugins as any),
			],
		});

		// `generate` works but we use `write` so it's easier to see output and debug
		rolldownOutput = await rolldownBuild.write({
			dir: config.build.outDir,
			format: "app",
			// TODO: hmr_rebuild returns source map when `sourcemap: true`
			sourcemap: "inline",
		});
		// TODO: rolldown freezes when accessing getter later so serialize it early.
		// (it looks like this doesn't happen anymore on latest rolldown)
		rolldownOutput = JSON.parse(JSON.stringify(rolldownOutput, null, 2));
		console.timeEnd("[rolldown:build]");
	}

	return {
		name: viteroll.name,
		config() {
			return {
				appType: "custom",
				optimizeDeps: {
					noDiscovery: true,
				},
			};
		},
		configResolved(config_) {
			config = config_;
		},
		configureServer(server_) {
			server = server_;

			// rolldown server as middleware
			server.middlewares.use(
				sirv(config.build.outDir, { dev: true, extensions: ["html"] }),
			);
		},
		async buildStart() {
			await fullBuild();
		},
		async buildEnd() {
			await rolldownBuild.close();
		},
		async handleHotUpdate(ctx) {
			const moduleIds = rolldownOutput.output[0].moduleIds;
			if (moduleIds.includes(ctx.file)) {
				// hmr
				if (process.env["VITEROLL_HMR"] !== "false") {
					const content = await ctx.read();
					// TODO: fow now target only self-accepting.
					// `rolldown_runtime.patch` crashes when patching non self-accepting entry.
					if (content.includes("module.hot.accept")) {
						logger.info(`hmr '${ctx.file}'`, { timestamp: true });
						console.time("[rolldown:hmr]");
						const result = await rolldownBuild.experimental_hmr_rebuild([
							ctx.file,
						]);
						console.timeEnd("[rolldown:hmr]");
						server.ws.send("rolldown:hmr", result);
						return [];
					}
				}
				// full reload
				logger.info(`full-reload '${ctx.file}'`, { timestamp: true });
				await fullBuild();
				server.ws.send({ type: "full-reload", path: ctx.file });
			}
		},
		transform(code, id) {
			// remove unnecessary /@vite/env
			if (id.endsWith("/vite/dist/client/client.mjs")) {
				code = code.replace(`import '@vite/env'`, "/* @vite/env removed */");
				return { code, map: null };
			}
		},
	};
}

// TODO: similar to vite:build-html plugin?
function viterollEntryPlugin(): rolldown.Plugin {
	return {
		name: "viteroll:entry",
		transform: {
			filter: {
				id: {
					include: [/\.html$/],
				},
			},
			async handler(code) {
				const htmlOutput = new MagicString(code);

				// extract <script src="...">
				let jsOutput = ``;
				const matches = code.matchAll(/<script\s+src="([^"]+)"><\/script>/dg);
				for (const match of matches) {
					jsOutput += `import ${JSON.stringify(match[1])};\n`;
					const [start, end] = match.indices![0];
					htmlOutput.remove(start, end);
				}

				// inject js entry
				htmlOutput.appendLeft(
					code.indexOf(`</body>`),
					'<script src="/index.js"></script>',
				);

				// inject client
				htmlOutput.appendLeft(
					code.indexOf(`</head>`),
					`
					<script type="module">
						import { createHotContext } from "/@vite/client";
						const hot = createHotContext("/__rolldown");
						hot.on("rolldown:hmr", (data) => {
							(0, eval)(data[1]);
						});
					</script>
					`,
				);

				// emit html
				this.emitFile({
					type: "asset",
					fileName: "index.html",
					source: htmlOutput.toString(),
				});

				// emit js entry
				return {
					code: jsOutput,
					moduleSideEffects: "no-treeshake",
				};
			},
		},
		generateBundle(_options, bundle) {
			// patch out hard-coded WebSocket setup "const socket = WebSocket(`ws://localhost:8080`)"
			const entry = bundle["index.js"];
			assert(entry.type === "chunk");
			entry.code = entry.code.replace(/const socket =.*?\n};/s, "");
		},
	};
}
