import { defineComponent } from "vue";

// https://shiki.style/guide/install#fine-grained-bundle
// https://github.com/pi0/nuxt-shiki/blob/494e84e2a50cafc1a98e06ae2c1c6f4c3c90e10a/src/runtime/shiki.ts

export default defineComponent(async () => {
	const { getHighlighterCore } = await import("shiki/core");
	const shikiWasm = await import("shiki/wasm");
	const highlighter = await getHighlighterCore({
		themes: [import("shiki/themes/vitesse-light.mjs")],
		langs: [import("shiki/langs/vue.mjs")],
		loadWasm: shikiWasm.default,
	});

	const code = await import("../_client-sfc.vue?raw");
	const html = highlighter.codeToHtml(code.default, {
		lang: "vue",
		theme: "vitesse-light",
	});
	return () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "start",
			}}
		>
			<h4>Shiki</h4>
			<div
				style={{
					border: "1px solid #cccccc",
					padding: "0.5rem",
				}}
			>
				<span>_client-sfc.vue</span>
				<div innerHTML={html}></div>
			</div>
		</div>
	);
});
