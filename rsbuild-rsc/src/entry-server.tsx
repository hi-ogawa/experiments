import React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";
import { getClientManifest } from "./lib/client-manifest";

export type FlightData = {
	node: React.ReactNode;
};

export type ServerResult = {
	flightStream: ReadableStream<Uint8Array>;
};

export async function handler(request: Request): Promise<ServerResult> {
	// TODO: action
	if (request.method === "POST") {
	}

	// [react node -> flight] react server
	const node = <Router request={request} />;
	const { browserManifest } = await getClientManifest();
	const flightStream = ReactServer.renderToReadableStream<FlightData>(
		{ node },
		browserManifest,
	);
	return { flightStream };
}

async function Router(props: { request: Request }) {
	const url = new URL(props.request.url);
	const { default: Layout } = await import("./routes/layout");
	let page = <h1>Not Found</h1>; // TODO: 404 status
	if (url.pathname === "/") {
		const { default: Page } = await import("./routes/page");
		page = <Page />;
	}
	if (url.pathname === "/stream") {
		const { default: Page } = await import("./routes/stream/page");
		page = <Page />;
	}
	return <Layout>{page}</Layout>;
}
