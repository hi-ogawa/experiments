import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { FlightData } from "./entry-server";
import { ErrorBoundary } from "./lib/error-boundary";
import { $__global } from "./lib/global";
import { setupBrowserRouter } from "./lib/router/browser";
import GlobalErrorPage from "./routes/global-error";
import type { CallServerCallback } from "./types/react-types";
import "./style.css?url";
import "./lib/client-references-browser.js";

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
	$__global.__f_call_server = callServer;

	// react client (flight -> react node)
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

	let browserRoot = (
		<ErrorBoundary Fallback={GlobalErrorPage}>
			<BrowserRoot />
		</ErrorBoundary>
	);
	if (!url.searchParams.has("__nostrict")) {
		browserRoot = <React.StrictMode>{browserRoot}</React.StrictMode>;
	}

	// react dom browser (react node -> html)
	if ((self as any).__nossr) {
		// render client only on ssr error
		ReactDOMClient.createRoot(document).render(browserRoot);
	} else {
		const formState = (await initialFlight).actionResult;
		React.startTransition(() => {
			ReactDOMClient.hydrateRoot(document, browserRoot, {
				formState,
			});
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
				window.history.replaceState({}, "", window.location.href);
			}
		});
	}
}

main();

declare module "react-dom/client" {
	interface HydrationOptions {
		formState?: unknown;
	}

	interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS {
		Document: Document;
	}
}
