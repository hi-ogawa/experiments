import React from "react";
import ReactDOMClient from "react-dom/client";

function main() {
	React.startTransition(() => {
		ReactDOMClient.hydrateRoot(
			document.body,
			<React.StrictMode></React.StrictMode>,
		);
	});
}

main();
