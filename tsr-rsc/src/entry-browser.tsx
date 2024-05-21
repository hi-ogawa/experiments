import { tinyassert } from "@hiogawa/utils";
import { StartClient } from "@tanstack/start";
import React from "react";
import ReactDOM from "react-dom/client";
import { reviveFlightRecursive } from "./integrations/flight/client";
import { createRouter } from "./router";

declare let __ssr_dehydrated_state__: any;

async function main() {
	const router = createRouter();

	// for now we hydrate manually since we need async to revive flight loader
	const dehydratedState = await reviveFlightRecursive(__ssr_dehydrated_state__);

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
		ReactDOM.hydrateRoot(el, <StartClient router={router} />);
	});
}

main();
