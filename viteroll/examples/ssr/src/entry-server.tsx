// use browser build to avoid `require("stream")`
// https://github.com/rolldown/rolldown/issues/2041
import ReactDOMServer from "react-dom/server.browser";
import type { Connect } from "vite";
import { App } from "./app";

const handler: Connect.SimpleHandleFunction = (req, res) => {
	const url = new URL(req.url ?? "/", "https://vite.dev");
	console.log(`[SSR] ${req.method} ${url.pathname}`);
	const ssrHtml = ReactDOMServer.renderToString(<App />);
	res.setHeader("content-type", "text/html");
	// TODO: transformIndexHtml?
	res.end(`\
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<script type="module">
			import { createHotContext } from "/@vite/client";
			const hot = createHotContext("/__rolldown");
			hot.on("rolldown:hmr", (data) => {
				(0, eval)(data[1]);
			});
			window.__rolldown_hot = hot;
		</script>
	</head>
	<body>
		<div id="root">${ssrHtml}</div>
		<script src="/entry-client.js"></script>
	</body>
</html>
`);
};

export default handler;
