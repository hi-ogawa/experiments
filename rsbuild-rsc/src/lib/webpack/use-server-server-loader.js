export default async function loader(input) {
	/** @type {{ serverReferences: Set<string> }} */
	const { serverReferences } = this.getOptions();
	const id = this.resourcePath;

	serverReferences.delete(id);
	if (!/^("use server"|'use server')/.test(input)) {
		return input;
	}

	serverReferences.add(id);
	const matches = input.matchAll(/export async function (\w+)\(/g);
	const exportNames = [...matches].map((m) => m[1]);
	let output = input;
	output += `;import { registerServerReference as $$register } from "react-server-dom-webpack/server.edge";\n`;
	for (const name of exportNames) {
		output += `${name} = $$register(${name}, ${JSON.stringify(id)}, ${JSON.stringify(name)});\n`;
	}
	return output;
}
