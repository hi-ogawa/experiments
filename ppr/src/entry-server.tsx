import type http from "node:http";
import ReactDOMServer from "react-dom/server";
import type { ViteDevServer } from "vite";
import { App } from "./app";

export default async function handler(
	_req: http.IncomingMessage,
	res: http.ServerResponse,
) {
	let html: string;
	if (import.meta.env.DEV) {
		html = (await import("/index.html?raw")).default;
		html = html.replace(
			`<head>`,
			() => `<head>
				<link rel="stylesheet" href="/src/index.css?direct" />
				<script type="module" src="/@vite/client"></script>
			`,
		);
	} else {
		html = (await import("/dist/client/index.html?raw")).default;
	}

	const ssrHtml = ReactDOMServer.renderToString(<App />);
	html = html.replace(`<div id="root">`, () => `<div id="root">` + ssrHtml);
	res.setHeader("content-type", "text/html").end(html);
}
