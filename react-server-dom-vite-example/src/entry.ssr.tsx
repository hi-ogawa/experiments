import type { IncomingMessage, ServerResponse } from "node:http";
import {
	getClientReferenceManifest,
	setRequireModule,
} from "@vitejs/plugin-rsc/client";
import ReactDomServer from "react-dom/server";
import ReactClient from "react-server-dom-vite/client";
import type { ModuleRunner } from "vite/module-runner";
import type { ServerPayload } from "./entry.rsc";
import {
	createRequest,
	fromPipeableToWebReadable,
	fromWebToNodeReadable,
	sendResponse,
} from "./utils/fetch";
import { injectFlightStream } from "./utils/stream-script";

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	setRequireModule(async (id: string) => {
		// NOTE:
		// prepareDestinationForModule like logic needs to be implemented on user land
		// as it requires framework-specific multi builds info
		if (import.meta.env.DEV) {
			return import(/* @vite-ignore */ id);
		} else {
			// @ts-ignore
			const references = await import("virtual:vite-rsc/client-references");
			return references.default[id]();
		}
	});

	const request = createRequest(req, res);
	const url = new URL(request.url);
	const rscEntry = await importRscEntry();
	const rscResult = await rscEntry.handler(url, request);

	if (url.searchParams.has("__rsc")) {
		const response = new Response(rscResult.stream, {
			headers: {
				"content-type": "text/x-component;charset=utf-8",
			},
		});
		sendResponse(response, res);
		return;
	}

	const [flightStream1, flightStream2] = rscResult.stream.tee();

	const payload = await ReactClient.createFromNodeStream<ServerPayload>(
		fromWebToNodeReadable(flightStream1),
		getClientReferenceManifest(),
	);

	const ssrAssets = await import("virtual:ssr-assets");

	const htmlStream = fromPipeableToWebReadable(
		ReactDomServer.renderToPipeableStream(payload.root, {
			bootstrapModules: ssrAssets.bootstrapModules,
			// @ts-ignore no type?
			formState: payload.formState,
		}),
	);

	const response = new Response(
		htmlStream
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(injectFlightStream(flightStream2)),
		{
			headers: {
				"content-type": "text/html;charset=utf-8",
			},
		},
	);
	sendResponse(response, res);
}

declare let __rscRunner: ModuleRunner;

async function importRscEntry(): Promise<typeof import("./entry.rsc")> {
	if (import.meta.env.DEV) {
		return await __rscRunner.import("/src/entry.rsc.tsx");
	} else {
		return await import("virtual:build-rsc-entry" as any);
	}
}
