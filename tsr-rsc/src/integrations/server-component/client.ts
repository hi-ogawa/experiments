import { useLoaderData } from "@tanstack/react-router";
import React from "react";
import { stringToStream } from "../utils";

export function useFlightLoader() {
	const data = useLoaderData({ strict: false }) as FlightData;
	const resolved = React.use(resolveFlightMap(data));
	return resolved;
}

// wrap it to object, so we can use it as React.use promise map key
// TODO: does tsr loader support stream?
export type FlightData = { f: string };

const flightMap = new WeakMap<FlightData, Promise<unknown>>();

function resolveFlightMap(data: FlightData) {
	let found = flightMap.get(data);
	if (!found) {
		found = readFlightClient(data);
		flightMap.set(data, found);
	}
	return found;
}

async function readFlightClient(data: FlightData) {
	const stream = stringToStream(data.f);
	if (import.meta.env.SSR) {
		(globalThis as any).__webpack_require__ = () => {};
		const { default: ReactClient } = await import(
			"react-server-dom-webpack/client.edge"
		);
		return ReactClient.createFromReadableStream(stream, {
			ssrManifest: {},
		});
	} else {
		(globalThis as any).__webpack_require__ = () => {};
		const { default: ReactClient } = await import(
			"react-server-dom-webpack/client.browser"
		);
		return ReactClient.createFromReadableStream(stream, {
			callServer: undefined,
		});
	}
}
