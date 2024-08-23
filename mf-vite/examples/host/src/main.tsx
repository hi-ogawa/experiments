import { init, loadRemote } from "@module-federation/runtime";
import ReactDOMClient from "react-dom/client";
import { App } from "./app";

async function main() {
	init({
		name: "host",
		remotes: [
			{
				name: "simple-esm",
				entry: "http://localhost:5000/simple/esm.js",
				// RemoteEntryType
				// https://github.com/module-federation/core/blob/b90fa7ded8786022d900081dd7c871f317c5e4b9/packages/runtime/src/type/config.ts#L17
				type: "module",
			},
		],
		shared: {},
	});
	const remoteSimpleEsm = await loadRemote<any>("simple-esm");

	const el = document.getElementById("app")!;
	ReactDOMClient.createRoot(el).render(
		<>
			<App />
			<pre>remoteSimpleEsm.add(1, 2) = {remoteSimpleEsm.add(1, 2)}</pre>
		</>,
	);
}

main().catch((e) => {
	const el = document.createElement("pre");
	el.style.color = "red";
	el.textContent = e.stack;
	document.body.appendChild(el);
	throw e;
});
