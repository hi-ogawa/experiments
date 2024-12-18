import type { IncomingMessage, ServerResponse } from "node:http";
import ReactClient from "@jacob-ebey/react-server-dom-vite/client";
import ReactDomServer from "react-dom/server";
import type { ModuleRunner } from "vite/module-runner";
import type { ServerPayload } from "./entry.rsc";
import {
	createRequest,
	fromPipeableToWebReadable,
	fromWebToNodeReadable,
	sendResponse,
} from "./utils/server";
import { injectFlightStream } from "./utils/stream-script";

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

	const [flightStream1, flightStream2] = rscResult.stream.tee();

	const payload = await ReactClient.createFromNodeStream<ServerPayload>(
		fromWebToNodeReadable(flightStream1),
		{
			resolveClientReference(reference) {
				// console.log("[debug:resolveClientReference]", { reference })
				const [id, name] = reference[0].split("#");
				let mod: Record<string, unknown>;
				return {
					async preload() {
						// console.log("[debug:preload]", { id, name})
						mod ??= await import(/* @vite-ignore */ id);
					},
					get() {
						// console.log("[debug:get]", { id, name })
						return mod[name];
					},
				};
			},
		},
	);

	const ssrAssets = await import("virtual:ssr-assets");

	const htmlStream = fromPipeableToWebReadable(
		ReactDomServer.renderToPipeableStream(payload.root, {
			bootstrapModules: ssrAssets.bootstrapModules,
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
		return (await import("virtual:build-rsc-entry")) as any;
	}
}
