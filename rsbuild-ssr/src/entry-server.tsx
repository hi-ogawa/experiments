import type { ServerAPIs, Rspack } from "@rsbuild/core";
import { App } from "./app";
import ReactDOMServer from "react-dom/server.edge";
import { tinyassert } from "@hiogawa/utils";

declare let __rsbuild_server__: ServerAPIs;

export default async function handler(_request: Request): Promise<Response> {
	const statsJson = await getStatsJson();
	let scripts: string[] = [];
	let styles: string[] = [];
	tinyassert(statsJson.assets);
	for (const { name } of statsJson.assets) {
		if (name.endsWith(".js") && !name.includes(".hot-update.js")) {
			scripts.push(`/${name}`);
		}
		if (name.endsWith(".css")) {
			styles.push(`/${name}`);
		}
	}

	const root = <Root styles={styles} />;
	const htmlStream = await ReactDOMServer.renderToReadableStream(root, {
		bootstrapScripts: scripts,
	});
	return new Response(htmlStream, {
		headers: {
			"content-type": "text/html",
		},
	});
}

async function getStatsJson(): Promise<Rspack.StatsCompilation> {
	if (import.meta.env.DEV) {
		const stats = await __rsbuild_server__.environments.web.getStats();
		return stats.toJson();
	} else {
		const { default: statsJson } = await import(
			/* webpackMode: "eager" */ "../dist/__client_stats.mjs" as string
		);
		return statsJson;
	}
}

function Root(props: { styles: string[] }) {
	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				<title>Rsbuild React SSR</title>
				{props.styles.map((href) => (
					<link key={href} rel="stylesheet" href={href} />
				))}
			</head>
			<body>
				<App />
			</body>
		</html>
	);
}
