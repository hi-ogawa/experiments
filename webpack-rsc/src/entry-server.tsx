import React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";
import Page from "./routes/page";

export type FlightData = React.ReactNode;

export async function handler(_request: Request) {
	// react server (react node -> flight)
	const node = <Page />;
	const flightStream = ReactServer.renderToReadableStream<FlightData>(
		node,
		createBundlerConfig(),
	);
	return flightStream;
}

function createBundlerConfig() {
	return new Proxy(
		{},
		{
			get(_target, p: string, _receiver) {
				const [id, name] = p.split("#");
				return { id, name, chunks: [] };
			},
		},
	);
}
