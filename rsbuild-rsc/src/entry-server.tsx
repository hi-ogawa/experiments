import { tinyassert } from "@hiogawa/utils";
import React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";
import { getClientManifest } from "./lib/client-manifest";
import { getServerManifest } from "./lib/server-manifest";
import "./lib/virtual-server-references.js";

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

	// [react node -> flight] react server
	const node = <Router request={request} />;
	const { browserManifest } = await getClientManifest();
	const flightStream = ReactServer.renderToReadableStream<FlightData>(
		{ node, actionResult },
		browserManifest,
	);
	return { flightStream, actionResult };
}

//
// file system routes
//

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
	if (url.pathname === "/action") {
		const { default: Page } = await import("./routes/action/page");
		page = <Page />;
	}
	return <Layout>{page}</Layout>;
}

//
// server action
//

type ActionResult = unknown;

export async function actionHandler(request: Request): Promise<ActionResult> {
	const url = new URL(request.url);
	const { serverManifest } = await getServerManifest();
	let boundAction: Function;
	if (url.searchParams.has("__f")) {
		// client stream request
		const contentType = request.headers.get("content-type");
		const body = contentType?.startsWith("multipart/form-data")
			? await request.formData()
			: await request.text();
		const args = await ReactServer.decodeReply(body);
		const $$id = url.searchParams.get("__a");
		tinyassert($$id);
		const entry = serverManifest[$$id];
		// @ts-expect-error
		const mod = __webpack_require__(entry.id);
		boundAction = () => mod[entry.name](...args);
	} else {
		// progressive enhancement
		const formData = await request.formData();
		const decodedAction = await ReactServer.decodeAction(
			formData,
			serverManifest,
		);
		boundAction = async () => {
			const result = await decodedAction();
			const formState = await ReactServer.decodeFormState(result, formData);
			return formState;
		};
	}
	return boundAction();
}
