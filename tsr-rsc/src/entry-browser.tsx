import { StartClient } from "@tanstack/start";
import React from "react";
import ReactDOM from "react-dom/client";
import { reviveFlightClientJson } from "./integrations/server-component/client";
import { createRouter } from "./router";

declare let __ssr_dehydrated_state__: any;

async function main() {
	const router = createRouter();

	// HACK
	// for now we hydrate manually since we need async to revive flight loader
	// console.log(__ssr_dehydrated_state__);
	// const deh1 = JSON.parse(__ssr_dehydrated_state__);
	// console.log(deh1);
	window.__TSR_DEHYDRATED__ = { data: JSON.stringify("unused") };
	const revived = await reviveFlightClientJson(__ssr_dehydrated_state__);
	console.log(revived);

	// patch transforer.parse for custom dehydration
	router.update({
		transformer: {
			parse(_str) {
				return revived;
			},
			stringify(obj) {
				console.trace(obj);
				return JSON.stringify(obj);
			},
		},
	});
	router.hydrate();

	1 &&
		React.startTransition(() => {
			ReactDOM.hydrateRoot(document, <StartClient router={router} />);
		});
}

main();
