import crypto from "node:crypto";
import path from "node:path";
import { transformServerActionServer } from "@hiogawa/transforms";
import { tinyassert } from "@hiogawa/utils";
import { parseAstAsync } from "vite";

/**
 * @typedef {{ manager: import("../build-manager.js").BuildManager }} LoaderOptions
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

	const { manager } = this.getOptions();
	delete manager.serverReferenceMap[modName];

	tinyassert(this._compiler);
	const serverId = hashString(path.relative(this._compiler.context, modName));

	const ast = await parseAstAsync(input);
	const { output } = await transformServerActionServer(input, ast, {
		id: serverId,
		runtime: "$$register",
	});
	if (!output.hasChanged()) {
		callback(null, input);
		return;
	}

	manager.serverReferenceMap[modName] = serverId;
	output.prepend(`\
import $$ReactServer from "react-server-dom-webpack/server.edge";
const $$register = (action, id, name) =>
	typeof action !== "function"
	? action
	: $$ReactServer.registerServerReference(action, id, name);
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
