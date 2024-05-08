import vue from "@vitejs/plugin-vue";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		patchVueTransform(vue()),
		// replace __sfc__.__file for deterministic tests
		{
			name: "replace-sfc-file",
			transform(code, id, _options) {
				if (/\.vue$/.test(id)) {
					return code.replace(
						`['__file',"${id}"]`,
						`['__file',"<test>/${id.split("/").at(-1)}"]`,
					);
				}
			},
		},
	],
	test: {
		dir: "src",
	},
});

// force non-ssr transform to render vnode
function patchVueTransform(plugin: Plugin): Plugin {
	if (typeof plugin.transform === "function") {
		const oldTransform = plugin.transform;
		plugin.transform = function (code, id) {
			return oldTransform.apply(this, [code, id, { ssr: false }]);
		};
	}
	return plugin;
}
