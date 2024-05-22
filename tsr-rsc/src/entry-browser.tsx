import { tinyassert } from "@hiogawa/utils";
import { StartClient } from "@tanstack/start";
import React from "react";
import ReactDOMClient from "react-dom/client";
import { reviveFlightRecursive } from "./integrations/flight/client";
import { createRouter } from "./router";

async function main() {
	const router = createRouter();

	// TODO
	// for now we hydrate manually since we need async to revive flight loader
	const dehydratedState = await reviveFlightRecursive(
		(globalThis as any).__ssr_dehydrated_state__,
	);

	// patch transforer.parse to intercept dehydrate state
	router.update({
		transformer: {
			parse(_str) {
				return dehydratedState;
			},
			stringify(_obj) {
				throw new Error("unused");
			},
		},
	});
	window.__TSR_DEHYDRATED__ = { data: "unused" };
	router.hydrate();

	const el = document.getElementById("root");
	tinyassert(el);
	React.startTransition(() => {
		ReactDOMClient.hydrateRoot(el, <StartClient router={router} />);
	});
}

main();
