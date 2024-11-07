import { Connect } from "vite";

const handler: Connect.SimpleHandleFunction = (req, res) => {
	const url = new URL(req.url ?? "/", "https://vite.dev");
	console.log(`[SSR] ${req.method} ${url.pathname}`);
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
		<h1>Rolldown SSR</h1>
		<div>pathname: ${url.pathname}</div>
		<div id="root"></div>
		<script src="/entry-client.js"></script>
	</body>
</html>
`);
};

export default handler;
