import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { FlightData } from "./entry-server";
import "./lib/virtual-client-references-browser.js";
import "./style.css";
import { setupBrowserRouter } from "./lib/router/browser";

async function main() {
	const url = new URL(window.location.href);
	if (url.searchParams.has("__nojs")) {
		return;
	}

	// TODO
	const callServer = () => {};

	// [flight => react node] react client
	const initialFlight = ReactClient.createFromReadableStream<FlightData>(
		(self as any).__flightStream,
		{ callServer },
	);

	function BrowserRoot() {
		const [flight, setFlight] =
			React.useState<Promise<FlightData>>(initialFlight);

		React.useEffect(() => {
			return setupBrowserRouter(() => {
				const url = new URL(window.location.href);
				url.searchParams.set("__f", "");
				React.startTransition(() =>
					setFlight(
						ReactClient.createFromFetch<FlightData>(fetch(url), {
							callServer,
						}),
					),
				);
			});
		}, []);

		return <>{React.use(flight).node}</>;
	}

	let browserRoot = <BrowserRoot />;
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
