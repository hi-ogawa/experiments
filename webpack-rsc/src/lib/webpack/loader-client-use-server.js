import crypto from "node:crypto";
import path from "node:path";
import { transformDirectiveProxyExport } from "@hiogawa/transforms";
import { tinyassert } from "@hiogawa/utils";
import { parseAstAsync } from "vite";

/**
 * @typedef {{ manager: import("../build-manager.js").BuildManager, runtime: string }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const callback = this.async();
	const modName = this._module?.nameForCondition();
	if (!modName || !input.includes("use server")) {
		callback(null, input);
		return;
	}

	const { manager, runtime } = this.getOptions();
	delete manager.serverReferenceMap[modName];

	tinyassert(this._compiler);
	const serverId = hashString(path.relative(this._compiler.context, modName));

	const ast = await parseAstAsync(input);
	const output = await transformDirectiveProxyExport(ast, {
		directive: "use server",
		id: serverId,
		runtime: "$$proxy",
	});
	if (!output) {
		callback(null, input);
		return;
	}

	manager.serverReferenceMap[modName] = serverId;
	output.prepend(`\
import $$ReactClient from "${runtime}";
const $$proxy = (id, name) => $$ReactClient.createServerReference(id + "#" + name, (...args) => __f_call_server(...args));
`);
	callback(null, output.toString());
}

/**
 *
 * @param {string} value
 */
function hashString(value) {
	return crypto.createHash("sha256").update(value).digest().toString("hex");
}
