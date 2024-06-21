// TODO: use https://github.com/hi-ogawa/vite-plugins/tree/main/packages/transforms

import path from "node:path";
import { tinyassert } from "@hiogawa/utils";

/**
 * @typedef {{ manager: import("../build-manager.js").BuildManager }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const callback = this.async();
	const { manager } = this.getOptions();

	const modName = this._module?.nameForCondition();
	if (!modName) {
		callback(null, input);
		return;
	}

	delete manager.clientReferenceMap[modName];
	manager.clientReferences.delete(this.resourcePath);

	// "use strict" injected by other loaders?
	if (!/^("use client"|'use client')/m.test(input)) {
		callback(null, input);
		return;
	}

	tinyassert(this._compiler);
	const clientId = path.relative(this._compiler.context, modName);
	manager.clientReferenceMap[modName] = clientId;
	manager.clientReferences.add(this.resourcePath);
	const matches = input.matchAll(/export function (\w+)\(/g);
	const exportNames = [...matches].map((m) => m[1]);
	let output = `import { registerClientReference as $$register } from "react-server-dom-webpack/server.edge";\n`;
	for (const name of exportNames) {
		output +=
			exportExpr(
				name,
				`$$register(() => {}, ${JSON.stringify(clientId)}, ${JSON.stringify(name)})`,
			) + ";\n";
	}
	callback(null, output);
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
