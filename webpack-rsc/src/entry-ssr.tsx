import React from "react";
import ReactDOMServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import type { FlightData } from "./entry-server";
import * as entryReactServer from "./entry-server-layer";
import { getClientAssets } from "./lib/client-assets";
import { getClientManifest } from "./lib/client-manifest";

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

// based on https://github.com/remix-run/react-router/blob/09b52e491e3927e30e707abe67abdd8e9b9de946/packages/react-router/lib/dom/ssr/single-fetch.tsx#L49
function StreamTransfer(props: { stream: ReadableStream<Uint8Array> }) {
	const textStream = props.stream.pipeThrough(new TextDecoderStream());
	const reader = textStream.getReader();

	const results = new Array<Promise<ReadableStreamReadResult<string>>>();

	function toScript(code: string) {
		return <script dangerouslySetInnerHTML={{ __html: code }} />;
	}

	function Recurse(props: { depth: number }) {
		const result = React.use((results[props.depth] ??= reader.read()));
		if (result.done) {
			return toScript(`self.__flightStreamController.close()`);
		}
		// TODO: escape
		const data = JSON.stringify(result.value);
		return (
			<>
				{toScript(`self.__flightStreamController.enqueue(${data})`)}
				<React.Suspense>
					<Recurse depth={props.depth + 1} />
				</React.Suspense>
			</>
		);
	}

	return (
		<>
			{toScript(`
self.__flightStream = new ReadableStream({
	start(c) {
		self.__flightStreamController = c;
	}
}).pipeThrough(new TextEncoderStream())
`)}
			<React.Suspense>
				<Recurse depth={0} />
			</React.Suspense>
		</>
	);
}
