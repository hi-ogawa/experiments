import React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";

const Counter = ReactServer.registerClientReference(
	{},
	"/home/hiroshi/code/personal/experiments/rsbuild-rsc/src/routes/_client.tsx",
	"Counter",
) as React.ComponentType;

const Hydrated = ReactServer.registerClientReference(
	{},
	"/home/hiroshi/code/personal/experiments/rsbuild-rsc/src/routes/_client.tsx",
	"Hydrated",
) as React.ComponentType;

export default function Page() {
	return (
		<div id="root">
			<h1>Rsbuild RSC</h1>
			<pre>{React.version}</pre>
			<Hydrated />
			<Counter />
			<p className="read-the-docs">
				<a href="https://github.com/hi-ogawa/experiments/tree/main/rsbuild-rsc">
					View code on GitHub
				</a>
			</p>
		</div>
	);
}
