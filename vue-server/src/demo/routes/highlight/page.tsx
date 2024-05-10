import { type HighlighterCore, getHighlighterCore } from "shiki/core";
import { defineComponent, inject } from "vue";
import {
	SERVER_REQUEST_CONTEXT,
	type ServerRequestContext,
} from "../../features/server-context";
import { Form } from "../_client";
import DEFAULT_CODE from "../_client-sfc.vue?raw";

let highlighter: HighlighterCore;

export default defineComponent(async () => {
	const serverContext = inject<ServerRequestContext>(SERVER_REQUEST_CONTEXT)!;
	let code = serverContext.url.searchParams.get("code") ?? DEFAULT_CODE;
	code = code.replaceAll(/\r/g, ""); // CRLF -> LF

	highlighter ??= await getHighlighterCore({
		themes: [import("shiki/themes/vitesse-light.mjs")],
		langs: [import("shiki/langs/vue.mjs")],
		loadWasm: import("shiki/wasm"),
	});

	const html = highlighter.codeToHtml(code, {
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
					display: "flex",
					gap: "1rem",
					alignItems: "stretch",
					minHeight: "20rem",
					minWidth: "54rem",
				}}
			>
				<Form
					style={{
						flex: "1",
						display: "flex",
						flexDirection: "column",
						gap: "0.5rem",
					}}
					replace
				>
					{() => (
						<>
							<textarea
								style={{
									flex: "1",
									padding: "0.5rem",
								}}
								name="code"
								value={code}
							/>
							<button>Submit</button>
						</>
					)}
				</Form>
				<div
					style={{
						flex: "1",
						border: "1px solid #cccccc",
						padding: "0.5rem",
					}}
				>
					<style>{`pre.shiki { margin: 0 }`}</style>
					<div innerHTML={html}></div>
				</div>
			</div>
		</div>
	);
});
