import type { Rspack, ServerAPIs } from "@rsbuild/core";
import ReactDOMServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import type { FlightData } from "./entry-server";
import { injectFlightStreamScript } from "./lib/flight-stream-script";
import { tinyassert } from "@hiogawa/utils";

declare let __rsbuild_server__: ServerAPIs;

export default async function handler(request: Request): Promise<Response> {
	const reactServer = await importReactServer();
	const { flightStream } = await reactServer.handler(request);

	const url = new URL(request.url);
	if (url.searchParams.has("__f")) {
		return new Response(flightStream, {
			headers: {
				"content-type": "text/x-component;charset=utf-8",
			},
		});
	}

	const [flightStream1, flightStream2] = flightStream.tee();

	// [flight => react node] react client
	const flightData = await ReactClient.createFromReadableStream<FlightData>(
		flightStream1,
		{ ssrManifest: { moduleMap: {} } },
	);
	const ssrRoot = <>{flightData.node}</>;

	const assets = await getClientAssets();

	// [react node => html] react dom server
	const htmlStream = await ReactDOMServer.renderToReadableStream(ssrRoot, {
		// TODO
		bootstrapModules: assets.js,
	});

	const htmlStreamFinal = htmlStream
		.pipeThrough(new TextDecoderStream())
		// send a copy of flight stream together with ssr
		.pipeThrough(injectFlightStreamScript(flightStream2))
		.pipeThrough(new TextEncoderStream());

	return new Response(htmlStreamFinal, {
		headers: {
			"content-type": "text/html",
		},
	});
}

async function importReactServer(): Promise<typeof import("./entry-server")> {
	if (import.meta.env.DEV) {
		return __rsbuild_server__.environments.server.loadBundle("index");
	} else {
		const mod = await import(
			/* webpackIgnore: true */ "../server/index.cjs" as string
		);
		return mod.default;
	}
}

async function getClientAssets() {
	const statsJson = await getStatsJson();
	tinyassert(statsJson.assets);

	const js: string[] = [];
	const css: string[] = [];

	for (const { name } of statsJson.assets) {
		if (name.endsWith(".js") && !name.includes(".hot-update.js")) {
			js.push(`/${name}`);
		}
		if (name.endsWith(".css")) {
			css.push(`/${name}`);
		}
	}

	return { js, css };
}

async function getStatsJson(): Promise<Rspack.StatsCompilation> {
	if (import.meta.env.DEV) {
		const stats = await __rsbuild_server__.environments.web.getStats();
		return stats.toJson();
	} else {
		const { default: statsJson } = await import(
			/* webpackIgnore: true */ "../browser/stats.json" as string,
			{ with: { type: "json" } }
		);
		return statsJson;
	}
}
