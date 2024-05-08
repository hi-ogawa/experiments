import hljs from "highlight.js/lib/core";
import hljsXml from "highlight.js/lib/languages/xml";
import { defineComponent } from "vue";

export default defineComponent(async () => {
	hljs.registerLanguage("xml", hljsXml);
	const code = await import("../_client-sfc.vue?raw");
	const html = hljs.highlight(code.default, { language: "xml" }).value;
	return () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "start",
			}}
		>
			<h4>Highlight.js</h4>
			<div
				style={{
					border: "1px solid #cccccc",
					padding: "0.5rem",
				}}
			>
				<span>_client-sfc.vue</span>
				<pre innerHTML={html}></pre>
			</div>
		</div>
	);
});
