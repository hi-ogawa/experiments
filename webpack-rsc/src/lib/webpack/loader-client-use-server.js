import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import { exportExpr } from "./loader-server-use-client.js";

/**
 * @typedef {{ manager: import("../build-manager.js").BuildManager, runtime: string }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const callback = this.async();
	const modName = this._module?.nameForCondition();
	if (!modName) {
		callback(null, input);
		return;
	}

	const { manager, runtime } = this.getOptions();
	delete manager.serverReferenceMap[modName];

	if (!/^("use server"|'use server')/m.test(input)) {
		callback(null, input);
		return;
	}

	tinyassert(this._compiler);
	const serverId = path.relative(this._compiler.context, modName);
	manager.serverReferenceMap[modName] = serverId;

	const matches = input.matchAll(/export\s+(?:async)?\s+function\s+(\w+)\(/g);
	const exportNames = [...matches].map((m) => m[1]);
	let output = `import { createServerReference as $$proxy } from "${path.resolve(runtime)}";\n`;
	for (const name of exportNames) {
		output +=
			exportExpr(
				name,
				`$$proxy(${JSON.stringify(serverId)}, ${JSON.stringify(name)})`,
			) + ";\n";
	}
	callback(null, output);
}
