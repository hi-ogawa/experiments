import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { FlightData } from "./entry-server";

async function main() {
	// react client (flight -> react node)
	const node = await ReactClient.createFromReadableStream<FlightData>(
		(globalThis as any).__flightStream,
		{ callServer: () => {} },
	);

	// react dom browser (react node -> html)
	React.startTransition(() => {
		ReactDOMClient.hydrateRoot(document, node);
	});
}

main();
