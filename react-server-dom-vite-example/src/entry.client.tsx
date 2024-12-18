import ReactClient from "@jacob-ebey/react-server-dom-vite/client";
import ReactDomClient from "react-dom/client";
import type { ServerPayload } from "./entry.rsc";
import { getFlightStreamBrowser } from "./utils/stream-script";

async function main() {
	const payload = await ReactClient.createFromReadableStream<ServerPayload>(
		getFlightStreamBrowser(),
		{
			resolveClientReference(reference) {
				const [id, name] = reference[0].split("#");
				let mod: Record<string, unknown>;
				return {
					async preload() {
						mod ??= await import(/* @vite-ignore */ id);
					},
					get() {
						return mod[name];
					},
				};
			},
		},
	);
	ReactDomClient.hydrateRoot(document, payload.root);
}

main();
