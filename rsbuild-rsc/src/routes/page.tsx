import type React from "react";
import ReactServer from "react-server-dom-webpack/server.edge";

const Counter = ReactServer.registerClientReference(
	{},
	"./src/routes/_client.tsx",
	"Counter",
) as React.ComponentType;

export default function Page() {
	return (
		<div>
			<h1>Rsbuild RSC</h1>
			<Counter />
		</div>
	);
}
