import type http from "node:http";
import ReactDOMServer from "react-dom/server.edge";
import { App } from "./app";

export default async function handler(
	_req: http.IncomingMessage,
	res: http.ServerResponse,
) {
	let html = ReactDOMServer.renderToString(<App />, {});
	if (import.meta.env.DEV) {
		html = html.replace(
			`<head>`,
			() => `<head>
				<link rel="stylesheet" href="/src/index.css?direct" />
				<script type="module" src="/@vite/client"></script>
			`,
		);
	}
	res.setHeader("content-type", "text/html").end(html);
}
