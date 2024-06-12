import "./index.css";
import React from "react";
import ReactDOMClient from "react-dom/client";
import { App } from "./app";

function main() {
	React.startTransition(() => {
		ReactDOMClient.hydrateRoot(document.getElementById("root")!, <App />);
	});
}

main();
