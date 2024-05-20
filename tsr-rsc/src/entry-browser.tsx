import { StartClient } from "@tanstack/start";
import React from "react";
import ReactDOM from "react-dom/client";
import { createRouter } from "./router";

function main() {
	const router = createRouter();
	React.startTransition(() => {
		ReactDOM.hydrateRoot(document, <StartClient router={router} />);
	});
}

main();
