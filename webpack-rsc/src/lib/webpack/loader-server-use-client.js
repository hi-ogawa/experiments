// TODO: use https://github.com/hi-ogawa/vite-plugins/tree/main/packages/transforms

/**
 * @typedef {{ manager: import("../build-manager.js").BuildManager }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const callback = this.async();
	const { manager } = this.getOptions();
	manager.clientReferences.delete(this.resourcePath);

	// "use strict" injected by other loaders?
	if (!/^("use client"|'use client')/m.test(input)) {
		callback(null, input);
		return;
	}

	manager.clientReferences.add(this.resourcePath);
	const id = this.resourcePath; // TODO: obfuscate id
	const matches = input.matchAll(/export function (\w+)\(/g);
	const exportNames = [...matches].map((m) => m[1]);
	let output = `import { registerClientReference as $$register } from "react-server-dom-webpack/server.edge";\n`;
	for (const name of exportNames) {
		output +=
			exportExpr(
				name,
				`$$register(() => {}, ${JSON.stringify(id)}, ${JSON.stringify(name)})`,
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
