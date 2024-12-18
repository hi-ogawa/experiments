import ReactClient from "@jacob-ebey/react-server-dom-vite/client";
import ReactDomClient from "react-dom/client";
import type { ServerPayload } from "./entry.rsc";
import { getFlightStreamBrowser } from "./utils/stream-script";

async function main() {
	const payload = await ReactClient.createFromReadableStream<ServerPayload>(
		getFlightStreamBrowser(),
		{},
	);
	ReactDomClient.hydrateRoot(document, payload.root);

	const el = document.createElement("div");
	el.textContent = "hydrated";
	document.body.appendChild(el);
}

main();
