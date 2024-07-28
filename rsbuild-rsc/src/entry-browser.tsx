import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { FlightData } from "./entry-server";
import "./lib/virtual-client-references-browser.js";
import "./style.css";
import { setupBrowserRouter } from "./lib/router/browser";
import type { CallServerCallback } from "./types/react-types";

async function main() {
	const url = new URL(window.location.href);
	if (url.searchParams.has("__nojs")) {
		return;
	}

	let $__setFlight: (flight: Promise<FlightData>) => void;

	const callServer: CallServerCallback = async (id, args) => {
		const url = new URL(window.location.href);
		url.searchParams.set("__f", "");
		url.searchParams.set("__a", id);
		const flight = ReactClient.createFromFetch<FlightData>(
			fetch(url, {
				method: "POST",
				body: await ReactClient.encodeReply(args),
			}),
			{ callServer },
		);
		$__setFlight(flight);
		return (await flight).actionResult;
	};

	(self as any).__f_call_server = callServer;

	// [flight => react node] react client
	const initialFlight = ReactClient.createFromReadableStream<FlightData>(
		(self as any).__flightStream,
		{ callServer },
	);

	function BrowserRoot() {
		const [flight, setFlight] =
			React.useState<Promise<FlightData>>(initialFlight);

		React.useEffect(() => {
			$__setFlight = (flight) => React.startTransition(() => setFlight(flight));

			return setupBrowserRouter(() => {
				const url = new URL(window.location.href);
				url.searchParams.set("__f", "");
				$__setFlight(
					ReactClient.createFromFetch<FlightData>(fetch(url), {
						callServer,
					}),
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
