export class BuildManager {
	// keep mapping of
	//   module name (absolute path) => client id (hashed relative path)

	/** @type {Record<string, string>} */
	clientReferenceMap = {};

	/** @type {Record<string, string>} */
	serverReferenceMap = {};
}
