import type { ServerAPIs } from "@rsbuild/core";
import ReactDOMServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import type { FlightData } from "./entry-server";

declare let __rsbuild_server__: ServerAPIs;

export default async function handler(request: Request): Promise<Response> {
	const reactServer = await importReactServer();
	const { flightStream } = await reactServer.handler(request);

	const flightData = await ReactClient.createFromReadableStream<FlightData>(
		flightStream,
		{ ssrManifest: { moduleMap: {} } },
	);

	const ssrRoot = <>{flightData.node}</>;
	const htmlStream = await ReactDOMServer.renderToReadableStream(ssrRoot, {
		// TODO
		bootstrapModules: [],
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
		const mod = await import(
			/* webpackIgnore: true */ "../server/index.cjs" as string
		);
		return mod.default;
	}
}
