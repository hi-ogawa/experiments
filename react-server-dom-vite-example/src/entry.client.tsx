import ReactClient from "@jacob-ebey/react-server-dom-vite/client";
import React from "react";
import ReactDomClient from "react-dom/client";
import type { ServerPayload } from "./entry.rsc";
import type { CallServerFn } from "./types";
import { clientReferenceManifest } from "./utils/client-reference";
import { getFlightStreamBrowser } from "./utils/stream-script";

async function main() {
	const callServer: CallServerFn = async (id, args) => {
		const url = new URL(window.location.href);
		url.searchParams.set("__rsc", id);
		const payload = await ReactClient.createFromFetch<ServerPayload>(
			fetch(url, {
				method: "POST",
				body: await ReactClient.encodeReply(args),
			}),
			clientReferenceManifest,
			{ callServer },
		);
		setPayload(payload);
		return payload.returnValue;
	};

	const initialPayload =
		await ReactClient.createFromReadableStream<ServerPayload>(
			getFlightStreamBrowser(),
			clientReferenceManifest,
			{ callServer },
		);

	let setPayload: (v: ServerPayload) => void;

	function BrowserRoot() {
		const [payload, setPayload_] = React.useState(initialPayload);
		const [_isPending, startTransition] = React.useTransition();
		setPayload = (v) => startTransition(() => setPayload_(v));
		return payload.root;
	}

	ReactDomClient.hydrateRoot(document, <BrowserRoot />, {
		formState: initialPayload.formState,
	});
}

main();
