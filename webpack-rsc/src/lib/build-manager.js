export class BuildManager {
	/** @type {Set<string>} */
	clientReferences = new Set();

	/** @type {Set<string>} */
	serverReferences = new Set();

	/**
	 * module name (abs path) -> client id (rel path)
	 * @type {Record<string, string>}
	 */
	clientReferenceMap = {};
}
