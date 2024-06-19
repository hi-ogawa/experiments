import React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";
import { getClientManifest } from "./lib/client-manifest";

export type FlightData = React.ReactNode;

export async function handler(request: Request) {
	const { browserManifest } = await getClientManifest();

	// react server (react node -> flight)
	const node = <Router request={request} />;
	const flightStream = ReactServer.renderToReadableStream<FlightData>(
		node,
		browserManifest,
	);
	return flightStream;
}

// TODO: fs routes
// https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
// https://webpack.js.org/api/module-methods/#webpackinclude

const routes = {
	"/": () => import(/* webpackMode: 'eager' */ "./routes/page"),
	"/stream": () => import(/* webpackMode: 'eager' */ "./routes/stream/page"),
};

async function Router(props: { request: Request }) {
	const url = new URL(props.request.url);

	let node = <div>Not Found</div>;

	const route = routes[url.pathname as "/"];
	if (!!route) {
		const { default: Page } = await route();
		node = <Page />;
	}

	const { default: Layout } = await import(
		/* webpackMode: 'eager' */ "./routes/layout"
	);
	node = <Layout>{node}</Layout>;

	return node;
}
