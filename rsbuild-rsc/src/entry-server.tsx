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
	const node = <Router />;
	const { browserManifest } = await getClientManifest();
	const flightStream = ReactServer.renderToReadableStream<FlightData>(
		{ node },
		browserManifest,
	);
	return { flightStream };
}

async function Router() {
	const { default: Layout } = await import("./routes/layout");
	const { default: Page } = await import("./routes/page");
	return (
		<Layout>
			<Page />
		</Layout>
	);
}
