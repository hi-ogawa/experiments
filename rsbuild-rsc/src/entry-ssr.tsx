import type { ServerAPIs, Rspack } from "@rsbuild/core";
import { App } from "./app";
import ReactDOMServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import { tinyassert } from "@hiogawa/utils";
import type { FlightData } from "./entry-server";

declare let __rsbuild_server__: ServerAPIs;

export default async function handler(request: Request): Promise<Response> {
	if (1) {
		const reactServer = await importReactServer();
		const { flightStream } = await reactServer.handler(request);

		const flightData = await ReactClient.createFromReadableStream<FlightData>(
			flightStream,
			{ ssrManifest: { moduleMap: {} } },
		);

		const ssrRoot = <>{flightData.node}</>;
		const htmlStream = await ReactDOMServer.renderToReadableStream(ssrRoot, {});
		return new Response(htmlStream, {
			headers: {
				"content-type": "text/html",
			},
		});
	}

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

async function importReactServer(): Promise<typeof import("./entry-server")> {
	if (import.meta.env.DEV) {
		return __rsbuild_server__.environments.server.loadBundle("index");
	} else {
		throw "todo";
	}
}

async function getStatsJson(): Promise<Rspack.StatsCompilation> {
	if (import.meta.env.DEV) {
		const stats = await __rsbuild_server__.environments.web.getStats();
		return stats.toJson();
	} else {
		const { default: statsJson } = await import(
			/* webpackIgnore: true */ "../client/stats.json" as string,
			{ with: { type: "json" } }
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
