import path from "node:path";
import { transformDirectiveProxyExport } from "@hiogawa/transforms";
import { tinyassert } from "@hiogawa/utils";
import { parseAstAsync } from "vite";

/**
 * @typedef {{ manager: import("../build-manager.js").BuildManager }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const callback = this.async();
	const modName = this._module?.nameForCondition();
	if (!modName || !input.includes("use client")) {
		callback(null, input);
		return;
	}

	const { manager } = this.getOptions();
	delete manager.clientReferenceMap[modName];

	tinyassert(this._compiler);
	const clientId = path.relative(this._compiler.context, modName);

	const ast = await parseAstAsync(input);
	const output = await transformDirectiveProxyExport(ast, {
		directive: "use client",
		id: clientId,
		runtime: "$$proxy",
	});
	if (!output) {
		callback(null, input);
		return;
	}

	manager.clientReferenceMap[modName] = clientId;
	output.prepend(`\
import { registerClientReference } from "react-server-dom-webpack/server.edge";
const $$proxy = (id, name) => registerClientReference(() => {}, id, name);
`);
	callback(null, output.toString());
}

/**
 *
 * @param {string} name
 * @param {string} expr
 */
export function exportExpr(name, expr) {
	return name === "default"
		? `export default ${expr}`
		: `export const ${name} = ${expr}`;
}
