import ReactDOMServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import type { FlightData } from "./entry-server";
import * as entryReactServer from "./entry-server-layer";
import { getClientAssets } from "./lib/client-assets";
import { getClientManifest } from "./lib/client-manifest";
import { StreamTransfer } from "./lib/ssr-stream";

export async function handler(request: Request) {
	const url = new URL(request.url);

	// react server (react node -> flight)
	const flightStream = await entryReactServer.handler(request);
	if (url.searchParams.has("__f")) {
		return new Response(flightStream, {
			headers: {
				"content-type": "text/x-component;charset=utf-8",
			},
		});
	}

	const [flightStream1, flightStream2] = flightStream.tee();

	// react client (flight -> react node)
	const { ssrManifest } = await getClientManifest();
	const node = await ReactClient.createFromReadableStream<FlightData>(
		flightStream1,
		{ ssrManifest },
	);
	const ssrRoot = (
		<>
			{node}
			{/* send a copy of flight stream together with ssr */}
			<StreamTransfer stream={flightStream2} />
		</>
	);

	// react dom ssr (react node -> html)
	const bootstrapScripts = await getClientAssets();
	const htmlStream = await ReactDOMServer.renderToReadableStream(ssrRoot, {
		bootstrapScripts,
	});

	return new Response(htmlStream, {
		headers: {
			"content-type": "text/html;charset=utf-8",
		},
	});
}
