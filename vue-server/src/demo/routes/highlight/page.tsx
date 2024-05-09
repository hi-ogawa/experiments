import { type HighlighterCore, getHighlighterCore } from "shiki/core";
import { defineComponent } from "vue";

let highlighter: HighlighterCore;

export default defineComponent(async () => {
	highlighter ??= await getHighlighterCore({
		themes: [import("shiki/themes/vitesse-light.mjs")],
		langs: [import("shiki/langs/vue.mjs")],
		loadWasm: import("shiki/wasm"),
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
			<h4>Highlight (Shiki)</h4>
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
