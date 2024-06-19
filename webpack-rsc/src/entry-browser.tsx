import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { FlightData } from "./entry-server";
import { setupBrowserRouter } from "./lib/router/browser";

async function main() {
	const url = new URL(window.location.href);
	if (url.searchParams.has("__nojs")) {
		return;
	}

	function callServer() {
		throw new Error("wip server action");
	}

	// react client (flight -> react node)
	const initialFlight = ReactClient.createFromReadableStream<FlightData>(
		(globalThis as any).__flightStream,
		{ callServer },
	);

	function BrowserRoot() {
		const [flight, setFlight] =
			React.useState<Promise<FlightData>>(initialFlight);

		React.useEffect(
			() =>
				setupBrowserRouter(() => {
					React.startTransition(() => {
						const url = new URL(window.location.href);
						url.searchParams.set("__f", "");
						setFlight(
							ReactClient.createFromFetch<FlightData>(fetch(url), {
								callServer,
							}),
						);
					});
				}),
			[],
		);

		return <>{React.use(flight)}</>;
	}

	const root = (
		<React.StrictMode>
			<BrowserRoot />
		</React.StrictMode>
	);

	// react dom browser (react node -> html)
	if (url.searchParams.has("__nossr")) {
		ReactDOMClient.createRoot(document).render(root);
	} else {
		React.startTransition(() => {
			ReactDOMClient.hydrateRoot(document, root);
		});
	}

	if (__define.DEV) {
		// @ts-expect-error
		// use dev server client
		// https://github.com/webpack/webpack-dev-server/blob/d78905bdb0326a7246e2df2fc6a1350acaa4c1b3/client-src/socket.js#L20-L23
		const { client } = await import("webpack-dev-server/client/socket.js");

		// custom event for server update
		client.onMessage((data: string) => {
			const message = JSON.parse(data);
			if (message.type === "custom:update-server") {
				window.location.reload();
			}
		});
	}
}

main();

declare module "react-dom/client" {
	interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS {
		Document: Document;
	}
}
