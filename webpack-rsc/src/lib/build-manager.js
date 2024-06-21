export class BuildManager {
	// keep mapping of
	//   module name (abs path) => client id (rel path)

	/** @type {Record<string, string>} */
	clientReferenceMap = {};

	/** @type {Record<string, string>} */
	serverReferenceMap = {};
}
