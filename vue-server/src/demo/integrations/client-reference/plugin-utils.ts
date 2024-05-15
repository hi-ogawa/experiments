import { tinyassert } from "@hiogawa/utils";
import type * as estree from "estree";
import { type Plugin, parseAstAsync } from "vite";
import { MagicString } from "vue/compiler-sfc";

export async function transformClientReference(input: string, id: string) {
	const { output } = await transformWrapExports(
		input,
		(expr, name) => `$$wrap((${expr}), ${JSON.stringify(id + "#" + name)})`,
	);
	output.prepend(
		`import { registerClientReference as $$wrap } from "/src/serialize";\n`,
	);
	return output;
}

export async function transformEmptyExports(input: string) {
	const { exportNames } = await transformWrapExports(input, () => "");
	const stmts = exportNames.map((name) =>
		name === "default"
			? "export default undefined"
			: `export const ${name} = undefined`,
	);
	return [...stmts, ""].join(";\n");
}

// extend types for rollup ast with node position
declare module "estree" {
	interface BaseNode {
		start: number;
		end: number;
	}
}

async function transformWrapExports(
	input: string,
	wrap: (expr: string, name: string) => string,
) {
	const ast = await parseAstAsync(input);
	const output = new MagicString(input);
	const exportNames: string[] = [];
	const toBeAppended: string[] = [];

	function wrapNode(name: string, expr: estree.BaseNode) {
		exportNames.push(name);
		output.update(
			expr.start,
			expr.end,
			wrap(input.slice(expr.start, expr.end), name),
		);
	}

	function wrapExport(name: string, exportName = name) {
		exportNames.push(exportName);
		toBeAppended.push(
			`const $$tmp_${name} = ${wrap(name, exportName)}`,
			`export { $$tmp_${name} as ${exportName} }`,
		);
	}

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
					output.remove(node.start, node.start + 6);
					wrapExport(node.declaration.id.name);
				} else if (node.declaration.type === "VariableDeclaration") {
					/**
					 * export const foo = 1, bar = 2
					 */
					output.remove(node.start, node.start + 6);
					for (const decl of node.declaration.declarations) {
						tinyassert(decl.id.type === "Identifier");
						wrapExport(decl.id.name);
					}
				} else {
					node.declaration satisfies never;
				}
			} else {
				if (node.source) {
					/**
					 * export { foo, bar as car } from './foo'
					 */
					output.remove(node.start, node.end);
					for (const spec of node.specifiers) {
						const name = spec.local.name;
						toBeAppended.push(
							`import { ${name} as $$import_${name} } from ${node.source.raw}`,
						);
						wrapExport(`$$import_${name}`, spec.exported.name);
					}
				} else {
					/**
					 * export { foo, bar as car }
					 */
					output.remove(node.start, node.end);
					for (const spec of node.specifiers) {
						wrapExport(spec.local.name, spec.exported.name);
					}
				}
			}
		}

		/**
		 * export * from './foo'
		 */
		if (node.type === "ExportAllDeclaration") {
			// vue sfc uses this to re-export setup script. for now we can ignore.
			// https://github.com/vitejs/vite-plugin-vue/blob/30a97c1ddbdfb0e23b7dc14a1d2fb609668b9987/packages/plugin-vue/src/main.ts#L372
		}

		/**
		 * export default function foo() {}
		 * export default class A {}
		 * export default () => {}
		 */
		if (node.type === "ExportDefaultDeclaration") {
			wrapNode("default", node.declaration);
		}
	}

	output.append(["", ...toBeAppended, ""].join(";\n"));

	return { exportNames, output };
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
