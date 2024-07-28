export default async function loader(input) {
	/** @type {{ serverReferences: Set<string>, runtime: string }} */
	const { serverReferences, runtime } = this.getOptions();
	const id = this.resourcePath;

	if (!/^("use server"|'use server')/.test(input)) {
		return input;
	}

	if (!serverReferences.has(id)) {
		throw new Error("unknown server references in client build: " + id);
	}

	const matches = input.matchAll(/export async function (\w+)\(/g);
	const exportNames = [...matches].map((m) => m[1]);
	let output = `import { createServerReference as $$proxy } from "${runtime}";\n`;
	for (const name of exportNames) {
		output += `export const ${name} = $$proxy(${JSON.stringify(id + "#" + name)}, (...args) => __f_call_server(...args));\n`;
	}
	return output;
}
