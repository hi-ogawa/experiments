import path from "node:path";
import { exportExpr } from "./loader-server-use-client.js";

/**
 * @typedef {{ manager: import("../build-manager.js").BuildManager, runtime: string }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const callback = this.async();
	const { manager, runtime } = this.getOptions();
	manager.serverReferences.delete(this.resourcePath);

	if (!/^("use server"|'use server')/m.test(input)) {
		callback(null, input);
		return;
	}

	manager.serverReferences.add(this.resourcePath);
	const id = this.resourcePath; // TODO: obfuscate id
	const matches = input.matchAll(/export\s+(?:async)?\s+function\s+(\w+)\(/g);
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
