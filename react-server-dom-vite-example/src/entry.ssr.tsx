import type { IncomingMessage, ServerResponse } from "node:http";
import ReactClient from "@jacob-ebey/react-server-dom-vite/client";
import ReactDomServer from "react-dom/server";
import type { ModuleRunner } from "vite/module-runner";
import type { ServerPayload } from "./entry.rsc";
import {
	createRequest,
	fromPipeableToWebReadable,
	fromWebReadable,
	sendResponse,
} from "./utils/server";

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	const request = createRequest(req, res);
	const url = new URL(request.url);
	const rscEntry = await importRscEntry();
	const rscResult = await rscEntry.handler(request);

	if (url.searchParams.has("__rsc")) {
		const response = new Response(rscResult.stream, {
			headers: {
				"content-type": "text/x-component;charset=utf-8",
			},
		});
		sendResponse(response, res);
		return;
	}

	const [flightStream1, _flightStream2] = rscResult.stream.tee();

	const payload = await ReactClient.createFromNodeStream<ServerPayload>(
		fromWebReadable(flightStream1),
		{},
	);

	const stream = fromPipeableToWebReadable(
		ReactDomServer.renderToPipeableStream(payload.root, {
			bootstrapModules: [
				// import.meta.env.DEV ? "/src/entry.client.tsx" : "/todo",
			],
		}),
	);
	const response = new Response(stream, {
		headers: {
			"content-type": "text/html;charset=utf-8",
		},
	});
	sendResponse(response, res);
}

declare let __rscRunner: ModuleRunner;

async function importRscEntry(): Promise<typeof import("./entry.rsc")> {
	if (import.meta.env.DEV) {
		return await __rscRunner.import("/src/entry.rsc.tsx");
	} else {
		// @ts-ignore
		return await import("virtual:build-rsc-entry");
	}
}
