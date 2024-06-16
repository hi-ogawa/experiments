import React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";

export type FlightData = React.ReactNode;

export async function handler(request: Request) {
	// react server (react node -> flight)
	const node = <Router request={request} />;
	const flightStream = ReactServer.renderToReadableStream<FlightData>(
		node,
		createBundlerConfig(),
	);
	return flightStream;
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

function createBundlerConfig() {
	return new Proxy(
		{},
		{
			get(_target, p: string, _receiver) {
				const [id, name] = p.split("#");
				console.log("[server.bundlerConfig]", { p, id, name });
				return {
					id,
					name,
					chunks: [
						// '_ssr_src_routes__client_tsx',
						// "(ssr)/./src/routes/_client.tsx",
						// '_ssr_src_routes__client_tsx'
						// id
					],
				};
			},
		},
	);
}
