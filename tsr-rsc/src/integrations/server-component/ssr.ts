import { $__global } from "../global";
import { streamToString } from "../utils";
import type { FlightData } from "./client";

export async function flightSsr(data: unknown): Promise<FlightData> {
	const reactServer = await importReactServer();
	const stream = await reactServer.render(data);
	const f = await streamToString(stream);
	return { __flight: true, f };
}

async function importReactServer(): Promise<
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
