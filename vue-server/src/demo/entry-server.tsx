import type { ViteDevServer } from "vite";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { deserialize, serialize } from "../serialize";
import { ClientCounter, ClientNested } from "./routes/_client";
import Page from "./routes/page";

export async function handler(request: Request) {
	const url = new URL(request.url);
	const result = await serialize(<Page />);

	if (url.searchParams.has("__serialize")) {
		return new Response(JSON.stringify(result), {
			headers: {
				"content-type": "application/json",
			},
		});
	}

	const Root = () => deserialize(result.data, { ClientCounter, ClientNested });
	const app = createSSRApp(Root);
	const ssrHtml = await renderToString(app);
	let html = await importHtmlTemplate();
	html = html.replace("<body>", () => `<div id="root">${ssrHtml}</div>`);
	html = html.replace(
		"<head>",
		() =>
			`<head><script>globalThis.__serialized = ${JSON.stringify(
				result,
			)}</script>`,
	);
	if (import.meta.env.DEV) {
		html = html.replace(
			"<head>",
			`<head><link rel="stylesheet" href="/src/demo/style.css?direct" />`,
		);
	}
	return new Response(html, {
		headers: {
			"content-type": "text/html",
		},
	});
}

declare let __vite_server: ViteDevServer;

async function importHtmlTemplate() {
	let html: string;
	if (import.meta.env.DEV) {
		html = (await import("/index.html?raw")).default;
		html = await __vite_server.transformIndexHtml("/", html);
	} else {
		html = (await import("/dist/client/index.html?raw")).default;
	}
	return html;
}
