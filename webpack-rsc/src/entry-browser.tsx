import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { FlightData } from "./entry-server";

async function main() {
	if (window.location.search.includes("__nojs")) {
		return;
	}

	// react client (flight -> react node)
	const node = await ReactClient.createFromReadableStream<FlightData>(
		(globalThis as any).__flightStream,
		{ callServer: () => {} },
	);
	const browserRoot = <>{node}</>;

	// react dom browser (react node -> html)
	React.startTransition(() => {
		ReactDOMClient.hydrateRoot(document, browserRoot);
	});

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
