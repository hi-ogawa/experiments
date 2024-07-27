import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { FlightData } from "./entry-server";
import "./lib/virtual-client-references-browser.js";

// emit chunk (manually for now)
// () => import("./routes/_client");

async function main() {
	const url = new URL(window.location.href);
	if (url.searchParams.has("__nojs")) {
		return;
	}

	// [flight => react node] react client
	const initialFlight = await ReactClient.createFromReadableStream<FlightData>(
		(self as any).__flightStream,
		// TODO
		{ callServer: () => {} },
	);

	let browserRoot = initialFlight.node;
	if (!url.searchParams.has("__nostrict")) {
		browserRoot = <React.StrictMode>{browserRoot}</React.StrictMode>;
	}

	// [react node => html] react dom client
	React.startTransition(() => {
		ReactDOMClient.hydrateRoot(
			document,
			<React.StrictMode>{browserRoot}</React.StrictMode>,
		);
	});
}

main();
