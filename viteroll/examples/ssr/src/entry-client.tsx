// TODO: how to inject automatically?
import "virtual:react-refresh/entry";
import React from "react";
import ReactDOMClient from "react-dom/client";
import { App } from "./app";

React.startTransition(() => {
	ReactDOMClient.hydrateRoot(document.getElementById("root")!, <App />);
});
