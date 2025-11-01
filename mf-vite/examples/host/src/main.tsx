import { init, loadRemote } from "@module-federation/runtime";
import React from "react";
import ReactDOMClient from "react-dom/client";
import { App } from "./app";

async function main() {
	init({
		name: "host",
		remotes: [
			{
				name: "simple-esm",
				entry: "http://localhost:5000/simple-esm/entry.js",
				// RemoteEntryType
				// https://github.com/module-federation/core/blob/b90fa7ded8786022d900081dd7c871f317c5e4b9/packages/runtime/src/type/config.ts#L17
				type: "module",
			},
			{
				name: "simple-manifest",
				entry: "http://localhost:5000/simple-manifest/mf-manifest.json",
			},
			{
				name: "simple-shared",
				entry: "http://localhost:5000/simple-shared/entry.js",
				type: "module",
			},
			{
				name: "simple-vite",
				entry: "http://localhost:5000/src/simple-vite/mf-manifest.json",
				type: "module",
			},
		],
		shared: {
			react: {
				lib: () => React,
			},
		},
	});

	const remoteSimpleEsm = await loadRemote<any>("simple-esm");
	const remoteSimpleManifest = await loadRemote<any>("simple-manifest");
	const remoteSimpleShared = await loadRemote<any>("simple-shared");
	const remoteSimpleVite = await loadRemote<any>("simple-vite");

	const el = document.getElementById("app")!;
	ReactDOMClient.createRoot(el).render(
		<>
			<App />
			<pre>remoteSimpleEsm.add(1, 2) = {remoteSimpleEsm.add(1, 2)}</pre>
			<pre>
				remoteSimpleManifest.mul(2, 3) = {remoteSimpleManifest.mul(2, 3)}
			</pre>
			<pre>
				remoteSimpleShared.Component:{" "}
				{<remoteSimpleShared.Component test="hello" />}
			</pre>
			<pre>remoteSimpleVite.App: {<remoteSimpleVite.App test="hello" />}</pre>
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
