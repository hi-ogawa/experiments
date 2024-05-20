import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import ReactClient from "react-server-dom-webpack/client.edge";
import { $$flight } from "../entry-ssr";
import { stringToStream } from "../integrations/utils";

export const Route = createFileRoute("/")({
	loader: async () => {
		// TODO: whole function should be extracted and executed on react server environment.
		const f = await $$flight(<div>hello server component</div>);
		console.log("[loader]", f);
		return { f };
	},
	component: IndexComponent,
});

// wrap it to object, so we can use as React.use promise weakmap key
type FlightData = { f: string };
const flightMap = new WeakMap<FlightData, Promise<unknown>>();

function resolveFlightMap(data: FlightData) {
	let found = flightMap.get(data);
	if (!found) {
		found = ReactClient.createFromReadableStream(stringToStream(data.f), {
			ssrManifest: {},
		});
		flightMap.set(data, found);
	}
	return found;
}

function IndexComponent() {
	const data = Route.useLoaderData();
	const node = React.use(resolveFlightMap(data));
	console.log(node);

	return (
		<div className="p-2">
			{node as any}
			<h3>Welcome Home!</h3>
		</div>
	);
}
