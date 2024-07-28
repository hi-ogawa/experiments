export default async function loader(input) {
	/** @type {{ clientReferences: Set<string> }} */
	const { clientReferences } = this.getOptions();
	const id = this.resourcePath;

	clientReferences.delete(id);
	if (!/^("use client"|'use client')/.test(input)) {
		return input;
	}

	clientReferences.add(id);
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
	return output;
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
