/**
 *
 * @param {{ getClientReferences: () => Record<string, string>; getServerReferences: () => Record<string, string>; }} rscOptions
 * @returns {import("vite").Plugin}
 */
export function vitePluginRscCore(rscOptions) {
	return [
		{
			name: "rsc-core",
			configEnvironment() {
				return {
					resolve: {
						noExternal: ["@vitejs/plugin-rsc"],
					},
				};
			},
			resolveId(source) {
				if (source.startsWith("virtual:vite-rsc/")) {
					return "\0" + source;
				}
			},
			load(id) {
				const references =
					id === "\0virtual:vite-rsc/client-references"
						? rscOptions.getClientReferences()
						: id === "\0virtual:vite-rsc/server-references"
							? rscOptions.getServerReferences()
							: undefined;
				if (references) {
					const code = Object.keys(references)
						.map(
							(id) =>
								`${JSON.stringify(id)}: () => import(${JSON.stringify(id)}),`,
						)
						.join("\n");
					return { code: `export default {${code}}`, map: { mappings: "" } };
				}
			},
		},
	];
}
