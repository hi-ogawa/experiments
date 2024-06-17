import { getExportNames, hasDirective } from "@hiogawa/transforms";
import { parseAstAsync } from "vite";

/**
 * @type {import("webpack").LoaderDefinitionFunction<{}, {}>}
 */
export default async function loader(source) {
	const callback = this.async();
	const ast = await parseAstAsync(source);
	if (!hasDirective(ast.body, "use client")) {
		callback(null, source);
		return;
	}
	const { exportNames } = getExportNames(ast, {});
	// TODO: how to get id?
	const id = "./src/routes/_client.tsx";
	const output = [
		`import { registerClientReference as $$register } from "react-server-dom-webpack/server.edge"`,
		...exportNames.map((name) =>
			exportExpr(
				name,
				`$$register(() => {}, ${JSON.stringify(id)}, ${JSON.stringify(name)})`,
			),
		),
	].join(";\n");
	callback(null, output);
}

/**
 *
 * @param {string} name
 * @param {string} expr
 */
function exportExpr(name, expr) {
	return name === "default"
		? `export default ${expr}`
		: `export const ${name} = ${expr}`;
}
