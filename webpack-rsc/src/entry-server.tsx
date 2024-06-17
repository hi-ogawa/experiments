import React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";

export type FlightData = React.ReactNode;

export async function handler(request: Request) {
	// react server (react node -> flight)
	const node = <Router request={request} />;
	const flightStream = ReactServer.renderToReadableStream<FlightData>(
		node,
		await getBundlerConfig(),
	);
	return flightStream;
}

async function getBundlerConfig() {
	if (1) {
		// manual manifest for now
		return {
			"./src/routes/_client.tsx#Hydrated": {
				id: "./src/routes/_client.tsx",
				name: "Hydrated",
				// eager chunk for now
				chunks: [],
				// chunks: ["src_routes__client_tsx"],
			},
			"./src/routes/_client.tsx#Counter": {
				id: "./src/routes/_client.tsx",
				name: "Counter",
				chunks: [],
				// chunks: ["src_routes__client_tsx"],
			},
		};
	}
	return import(/* webpackIgnore: true */ "./__bundler_config.js" as string);
}

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
