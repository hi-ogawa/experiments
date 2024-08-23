import { init, loadRemote } from "@module-federation/runtime";
import ReactDOMClient from "react-dom/client";
import { App } from "./app";

async function main() {
	init({
		name: "host",
		remotes: [
			{
				name: "remote-simple",
				entry: "http://localhost:5000/simple.js",
			},
		],
		shared: {},
	});
	await loadRemote("remote-simple");

	const el = document.getElementById("app")!;
	ReactDOMClient.createRoot(el).render(<App />);
}

main().catch((e) => {
	const el = document.createElement("pre");
	el.style.color = "red";
	el.textContent = e.stack;
	document.body.appendChild(el);
});
