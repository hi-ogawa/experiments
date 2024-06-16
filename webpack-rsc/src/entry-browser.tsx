import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactClient from "react-server-dom-webpack/client.browser";
import type { FlightData } from "./entry-server";

async function main() {
	if (window.location.search.includes("__nojs")) {
		return;
	}

	// TODO: "assets/" prefix is breaking something?

	// emit chunk
	() => import("./routes/_client");
	// ensure chunk is ready
	// TODO: needs to ensure transitive chunks?
	// @ts-ignore
	console.log(await __webpack_chunk_load__("src_routes__client_tsx"));

	// react client (flight -> react node)
	const node = await ReactClient.createFromReadableStream<FlightData>(
		(globalThis as any).__flightStream,
		{ callServer: () => {} },
	);

	// react dom browser (react node -> html)
	React.startTransition(() => {
		ReactDOMClient.hydrateRoot(document, node);
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
