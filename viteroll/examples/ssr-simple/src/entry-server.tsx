import type { Connect } from "vite";

const handler: Connect.SimpleHandleFunction = (req, res) => {
	const url = new URL(req.url ?? "/", "https://vite.dev");
	console.log(`[SSR] ${req.method} ${url.pathname}`);
	if (url.pathname === "/crash-ssr") {
		throw new Error("crash-ssr");
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
		Test SSR
	</body>
</html>
`);
};

export default handler;
