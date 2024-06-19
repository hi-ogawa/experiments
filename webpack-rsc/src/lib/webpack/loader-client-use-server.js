import path from "node:path";
import { exportExpr } from "./loader-server-use-client.js";

/**
 * @typedef {{ serverReferences: Set<string>, runtime: string }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const callback = this.async();
	const { serverReferences, runtime } = this.getOptions();
	serverReferences.delete(this.resourcePath);

	if (!/^("use server"|'use server')/m.test(input)) {
		callback(null, input);
		return;
	}

	serverReferences.add(this.resourcePath);
	const id = this.resourcePath; // TODO: obfuscate id
	const matches = input.matchAll(/export function (\w+)\(/g);
	const exportNames = [...matches].map((m) => m[1]);
	let output = `import { createServerReference as $$proxy } from "${path.resolve(runtime)}";\n`;
	for (const name of exportNames) {
		output +=
			exportExpr(
				name,
				`$$proxy(${JSON.stringify(id)}, ${JSON.stringify(name)})`,
			) + ";\n";
	}
	callback(null, output);
}
