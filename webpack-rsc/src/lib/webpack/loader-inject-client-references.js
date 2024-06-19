// TODO: use virtual module?

/**
 * @typedef {{ clientReferences: Set<string> }} LoaderOptions
 */

/**
 * @type {import("webpack").LoaderDefinitionFunction<LoaderOptions, {}>}
 */
export default async function loader(input) {
	const { clientReferences } = this.getOptions();
	input += [...clientReferences]
		.map((file) => `() => import(${JSON.stringify(file)})`)
		.join(";\n");
	return input;
}
