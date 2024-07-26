import React from "react";
import { App } from "./app";
import ReactDOMClient from "react-dom/client";

function main() {
	React.startTransition(() => {
		ReactDOMClient.hydrateRoot(
			document.body,
			<React.StrictMode>
				<App />
			</React.StrictMode>,
		);
	});
}

main();
