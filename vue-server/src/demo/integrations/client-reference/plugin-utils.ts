import { tinyassert } from "@hiogawa/utils";
import type * as estree from "estree";
import { type Plugin, parseAstAsync } from "vite";
import { MagicString } from "vue/compiler-sfc";

export async function transformClientReference(input: string, id: string) {
	const { entries } = await parseExports(input);
	const output = new MagicString(input);
	output.prepend(
		`import { registerClientReference as $$register } from "/src/serialize";`,
	);
	for (const entry of entries) {
		output.prependRight(entry.node.start, "/* @__PURE__ */ $$register((");
		output.prependRight(entry.node.end, `), "${id}#${entry.name}")`);
	}
	return output;
}

// extend types for rollup ast with node position
declare module "estree" {
	interface BaseNode {
		start: number;
		end: number;
	}
}

export async function parseExports(input: string) {
	const ast = await parseAstAsync(input);
	const entries: { name: string; node: estree.BaseNode }[] = [];

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
					entries.push({
						name: node.declaration.id.name,
						node: node.declaration,
					});
				} else if (node.declaration.type === "VariableDeclaration") {
					/**
					 * export const foo = 1, bar = 2
					 */
					for (const decl of node.declaration.declarations) {
						tinyassert(decl.id.type === "Identifier");
						tinyassert(decl.init);
						entries.push({
							name: decl.id.name,
							node: decl.init,
						});
					}
				} else {
					console.error(node);
					throw new Error("unsupported");
				}
			}
		}

		/**
		 * export default function foo() {}
		 * export default class A {}
		 * export default () => {}
		 */
		if (node.type === "ExportDefaultDeclaration") {
			entries.push({
				name: "default",
				node: node.declaration,
			});
		}
	}

	return { entries };
}

export function createVirtualPlugin(name: string, load: Plugin["load"]) {
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

export function vitePluginSilenceDirectiveBuildWarning(): Plugin {
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
