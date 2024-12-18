import ReactClient from "@jacob-ebey/react-server-dom-vite/client";
import React from "react";
import ReactDomClient from "react-dom/client";
import type { ServerPayload } from "./entry.rsc";
import type { CallServerFn } from "./types";
import { resolveClientReference } from "./utils/client-reference";
import { getFlightStreamBrowser } from "./utils/stream-script";

async function main() {
	const manifest = {
		resolveClientReference,
	};

	const callServer: CallServerFn = async (id, args) => {
		const url = new URL(window.location.href);
		url.searchParams.set("__rsc", id);
		const payloadPromise = ReactClient.createFromFetch<ServerPayload>(
			fetch(url, {
				method: "POST",
				body: await ReactClient.encodeReply(args),
			}),
			manifest,
			{ callServer },
		);
		setPayloadPromise(payloadPromise);
		return (await payloadPromise).returnValue;
	};

	const initialPayloadPromise =
		ReactClient.createFromReadableStream<ServerPayload>(
			getFlightStreamBrowser(),
			manifest,
			{ callServer },
		);

	let setPayloadPromise: (v: Promise<ServerPayload>) => void;

	function BrowserRoot() {
		const [payloadPromise, setPayloadPromise_] = React.useState(
			initialPayloadPromise,
		);
		const [_isPending, startTransition] = React.useTransition();
		setPayloadPromise = (v) => startTransition(() => setPayloadPromise_(v));
		return React.use(payloadPromise).root;
	}

	ReactDomClient.hydrateRoot(document, <BrowserRoot />, {
		formState: (await initialPayloadPromise).formState,
	});
}

main();
