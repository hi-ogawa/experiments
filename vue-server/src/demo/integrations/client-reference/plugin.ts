import fs from "node:fs";
import path from "node:path";
import { type Plugin, type PluginOption, parseAstAsync } from "vite";

export function vitePluginClientReference(): PluginOption {
	const transformPlugin: Plugin = {
		name: vitePluginClientReference.name + ":register",
		async transform(code, id, options) {
			if (options?.ssr && /^("use client"|'use client')/.test(code)) {
				const { exportNames } = await parseExports(code);
				const outCode = [
					code,
					`import { registerClientReference as $$register } from "@hiogawa/tiny-react";`,
					...[...exportNames].map(
						(name) => `$$register(${name}, "${id}#${name}");`,
					),
				].join("\n");
				return { code: outCode, map: null };
			}
			return;
		},
	};

	const virtualPlugin = createVirtualPlugin("client-references", async () => {
		const files = await fs.promises.readdir(path.resolve("src"), {
			withFileTypes: true,
			recursive: true,
		});
		const ids: string[] = [];
		for (const file of files) {
			if (file.isFile()) {
				const filepath = path.join(file.path, file.name);
				const code = await fs.promises.readFile(filepath, "utf-8");
				if (/^("use client"|'use client')/.test(code)) {
					ids.push(filepath);
				}
			}
		}
		const outCode = [
			"export default {",
			...ids.map((id) => `"${id}": () => import("${id}"),\n`),
			"}",
		].join("\n");
		return { code: outCode, map: null };
	});

	return [
		transformPlugin,
		virtualPlugin,
		vitePluginSilenceDirectiveBuildWarning(),
	];
}

async function parseExports(code: string) {
	const ast = await parseAstAsync(code);
	const exportNames = new Set<string>();
	for (const node of ast.body) {
		// named exports
		if (node.type === "ExportNamedDeclaration") {
			if (node.declaration) {
				if (
					node.declaration.type === "FunctionDeclaration" ||
					node.declaration.type === "ClassDeclaration"
				) {
					/**
					 * export function foo() {}
					 */
					exportNames.add(node.declaration.id.name);
				} else if (node.declaration.type === "VariableDeclaration") {
					/**
					 * export const foo = 1, bar = 2
					 */
					for (const decl of node.declaration.declarations) {
						if (decl.id.type === "Identifier") {
							exportNames.add(decl.id.name);
						}
					}
				}
			}
		}
	}
	return {
		exportNames,
	};
}

function createVirtualPlugin(name: string, load: Plugin["load"]) {
	name = "virtual:" + name;
	return {
		name,
		resolveId(source, _importer, _options) {
			if (source === name || source.startsWith(`${name}?`)) {
				return `\0${source}`;
			}
			return;
		},
		load(id, options) {
			if (id === `\0${name}` || id.startsWith(`\0${name}?`)) {
				return (load as any).apply(this, [id, options]);
			}
		},
	} satisfies Plugin;
}

function vitePluginSilenceDirectiveBuildWarning(): Plugin {
	return {
		name: vitePluginSilenceDirectiveBuildWarning.name,
		enforce: "post",
		config(config, _env) {
			return {
				build: {
					rollupOptions: {
						onwarn(warning, defaultHandler) {
							// https://github.com/vitejs/vite/issues/15012#issuecomment-1948550039
							if (
								warning.code === "SOURCEMAP_ERROR" &&
								warning.loc?.line === 1 &&
								warning.loc.column === 0
							) {
								return;
							}
							// https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
							if (
								(warning.code === "MODULE_LEVEL_DIRECTIVE" &&
									warning.message.includes(`"use client"`)) ||
								warning.message.includes(`"use server"`)
							) {
								return;
							}
							if (config.build?.rollupOptions?.onwarn) {
								config.build.rollupOptions.onwarn(warning, defaultHandler);
							} else {
								defaultHandler(warning);
							}
						},
					},
				},
			};
		},
	};
}
