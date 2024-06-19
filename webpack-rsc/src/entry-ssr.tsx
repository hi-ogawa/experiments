import ReactDOMServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import type { FlightData } from "./entry-server";
import * as entryReactServer from "./entry-server-layer";
import { getClientAssets } from "./lib/client-assets";
import { getClientManifest } from "./lib/client-manifest";
import { injectFlightStream } from "./lib/ssr-stream";
import GlobalErrorPage from "./routes/global-error";

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
	const flightData = await ReactClient.createFromReadableStream<FlightData>(
		flightStream1,
		{ ssrManifest },
	);
	const ssrRoot = flightData.node;

	// react dom ssr (react node -> html)
	let status = 200;
	let htmlStream: ReadableStream<Uint8Array>;
	const bootstrapScripts = await getClientAssets();
	try {
		htmlStream = await ReactDOMServer.renderToReadableStream(ssrRoot, {
			bootstrapScripts,
		});
	} catch (e) {
		// two-pass render for ssr error
		status = 500;
		const errorRoot = (
			<>
				<GlobalErrorPage />
				<script dangerouslySetInnerHTML={{ __html: "self.__nossr = true" }} />
			</>
		);
		htmlStream = await ReactDOMServer.renderToReadableStream(errorRoot, {
			bootstrapScripts,
		});
	}

	const htmlStreamFinal = htmlStream
		.pipeThrough(new TextDecoderStream())
		// send a copy of flight stream together with ssr
		.pipeThrough(injectFlightStream(flightStream2))
		.pipeThrough(new TextEncoderStream());

	return new Response(htmlStreamFinal, {
		status,
		headers: {
			"content-type": "text/html;charset=utf-8",
		},
	});
}
