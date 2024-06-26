import { tinyassert } from "@hiogawa/utils";
import React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";
import { getClientManifest } from "./lib/client-manifest";
import { type ActionResult, actionHandler } from "./lib/server-action/server";
import Layout from "./routes/layout";

export type FlightData = {
	node: React.ReactNode;
	actionResult?: ActionResult;
};

export type ServerResult = {
	flightStream: ReadableStream<Uint8Array>;
	actionResult?: ActionResult;
};

export async function handler(request: Request): Promise<ServerResult> {
	let actionResult: ActionResult | undefined;
	if (request.method === "POST") {
		actionResult = await actionHandler(request);
	}

	const { browserManifest } = await getClientManifest();

	// react server (react node -> flight)
	const node = <Router request={request} />;
	const flightStream = ReactServer.renderToReadableStream<FlightData>(
		{ node, actionResult },
		browserManifest,
	);
	return { flightStream, actionResult };
}

// fs routes
// https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
// https://webpack.js.org/api/module-methods/#webpackinclude

async function Router(props: { request: Request }) {
	const url = new URL(props.request.url);
	return (
		<Layout>
			<Route pathname={url.pathname} />
		</Layout>
	);
}

async function Route(props: { pathname: string }) {
	// TODO: not found?
	const mod = await importRoute(props.pathname);
	tinyassert(typeof mod.default === "function", "invalid route export");
	return <mod.default />;
}

function importRoute(pathname: string) {
	// "/"    => "page"
	// "/x"   => "x/page"
	// "/x/"  => "x/page"
	// "/x/y" => "x/y/page"
	const normalized =
		pathname
			// ensure trailing /
			.replace(/\/*$/, "/")
			// strip prefix /
			.replace(/^\//, "") + "page";

	return import(
		/* webpackMode: 'eager' */
		/* webpackInclude: /\/page\.[jt]sx?$/ */
		`./routes/${normalized}`
	);
}
