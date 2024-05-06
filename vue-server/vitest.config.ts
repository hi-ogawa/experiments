import vue from "@vitejs/plugin-vue";
import { Plugin } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [patchNonSsrTransform(vue())],
});

function patchNonSsrTransform(plugin: Plugin): Plugin {
	if (typeof plugin.transform === "function") {
		const oldTransform = plugin.transform;
		plugin.transform = function (code, id) {
			return oldTransform.apply(this, [code, id, { ssr: false }]);
		};
	}
	return plugin;
}
