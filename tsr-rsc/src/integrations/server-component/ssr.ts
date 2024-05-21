import { $__global } from "../global";
import { streamToString } from "../utils";
import type { FlightData } from "./client";

export async function handleFlight(reference: string): Promise<FlightData> {
	const reactServer = await importReactServer();
	const stream = await reactServer.handler(reference);
	return { __flight: true, f: await streamToString(stream) };
}

export async function importReactServer(): Promise<
	typeof import("../../entry-server")
> {
	let mod: any;
	if (import.meta.env.DEV) {
		mod = await $__global.reactServer.ssrLoadModule("/src/entry-server");
	} else {
		throw new Error("todo");
	}
	return mod;
}
