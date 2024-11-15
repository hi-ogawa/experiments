import type { Connect } from "vite";

const handler: Connect.SimpleHandleFunction = (req, res) => {
	const url = new URL(req.url ?? "/", "https://vite.dev");
	console.log(`[SSR] ${req.method} ${url.pathname}`);
	if (url.pathname === "/crash-ssr") {
		const error = new Error("crash-ssr");
		console.error(error);
		throw error;
	}
	res.setHeader("content-type", "text/html");
	// TODO: transformIndexHtml?
	res.end(`\
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	</head>
	<body>
		<h4>Rolldown SSR</h4>
		<a href="/crash-ssr">/crash-ssr</a>
	</body>
</html>
`);
};

export default handler;
