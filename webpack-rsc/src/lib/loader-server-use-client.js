/**
 * @typedef {{ clientReferences: Set<string> }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const callback = this.async();
	const { clientReferences } = this.getOptions();
	clientReferences.delete(this.resourcePath);

	// "use strict" injected by other loaders?
	if (!/^("use client"|'use client')/m.test(input)) {
		callback(null, input);
		return;
	}

	clientReferences.add(this.resourcePath);
	const matches = input.matchAll(/export function (\w+)\(/g);
	const exportNames = [...matches].map((m) => m[1]);
	// TODO: how to get id?
	const id = "./src/routes/_client.tsx";
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
function exportExpr(name, expr) {
	return name === "default"
		? `export default ${expr}`
		: `export const ${name} = ${expr}`;
}
