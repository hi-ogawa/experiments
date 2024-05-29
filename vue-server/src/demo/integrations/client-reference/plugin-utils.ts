import { getExportNames, transformWrapExport } from "@hiogawa/transforms";
import { type Plugin, parseAstAsync } from "vite";

export async function transformClientReference(input: string, id: string) {
	const ast = await parseAstAsync(input);
	const { output } = await transformWrapExport(input, ast, {
		id,
		runtime: "$$wrap",
		ignoreExportAllDeclaration: true,
	});
	output.prepend(`\
import { registerClientReference as $$wrap1 } from "/src/serialize";
const $$wrap = (v, id, name) => $$wrap1(v, id + "#" + name);
`);
	return output;
}

export async function transformEmptyExports(input: string) {
	const ast = await parseAstAsync(input);
	const { exportNames } = getExportNames(ast, {
		ignoreExportAllDeclaration: true,
	});
	const stmts = exportNames.map((name) =>
		name === "default"
			? "export default undefined"
			: `export const ${name} = undefined`,
	);
	return [...stmts, ""].join(";\n");
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
