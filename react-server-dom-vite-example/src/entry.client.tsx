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

	async function onNavigation() {
		const url = new URL(window.location.href);
		url.searchParams.set("__rsc", "");
		const payload = await ReactClient.createFromFetch<ServerPayload>(
			fetch(url),
			clientReferenceManifest,
			{ callServer },
		);
		setPayload(payload);
	}

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

		React.useEffect(() => {
			setPayload = (v) => startTransition(() => setPayload_(v));
		}, [startTransition, setPayload_]);

		React.useEffect(() => {
			return listenWindowHistory(onNavigation);
		}, []);

		return payload.root;
	}

	ReactDomClient.hydrateRoot(document, <BrowserRoot />, {
		formState: initialPayload.formState,
	});

	if (import.meta.hot) {
		import.meta.hot.on("react-server:update", (e) => {
			console.log("[react-server:update]", e.file);
			window.history.replaceState({}, "", window.location.href);
		});
	}
}

function listenWindowHistory(onNavigation: () => void) {
	window.addEventListener("popstate", onNavigation);

	const oldPushState = window.history.pushState;
	window.history.pushState = function (...args) {
		const res = oldPushState.apply(this, args);
		onNavigation();
		return res;
	};

	const oldReplaceState = window.history.replaceState;
	window.history.replaceState = function (...args) {
		const res = oldReplaceState.apply(this, args);
		onNavigation();
		return res;
	};

	return () => {
		window.removeEventListener("popstate", onNavigation);
		window.history.pushState = oldPushState;
		window.history.replaceState = oldReplaceState;
	};
}

main();
