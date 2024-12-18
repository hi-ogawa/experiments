import ReactClient from "@jacob-ebey/react-server-dom-vite/client";
import ReactDomClient from "react-dom/client";
import type { ServerPayload } from "./entry.rsc";
import { resolveClientReference } from "./utils/client";
import { getFlightStreamBrowser } from "./utils/stream-script";

async function main() {
	const payload = await ReactClient.createFromReadableStream<ServerPayload>(
		getFlightStreamBrowser(),
		{
			resolveClientReference,
		},
	);
	ReactDomClient.hydrateRoot(document, payload.root);
}

main();
