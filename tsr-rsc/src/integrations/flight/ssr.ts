import { tinyassert } from "@hiogawa/utils";
import { $__global } from "../global";
import { streamToString } from "../utils";
import type { FlightData } from "./client";

export async function handleFlight(
	reference: string,
	args: any[],
): Promise<FlightData> {
	const reactServer = await importReactServer();
	const stream = await reactServer.handler(reference, args);
	return { __flight: await streamToString(stream) };
}

export async function handleFlightRequest(request: Request) {
	const url = new URL(request.url);
	const reference = url.searchParams.get("reference");
	tinyassert(reference);
	const args = await request.json();
	const data = await handleFlight(reference, args);
	return new Response(JSON.stringify(data), {
		headers: {
			"content-type": "application/json",
		},
	});
}

export async function importReactServer(): Promise<typeof import("./server")> {
	let mod: any;
	if (import.meta.env.DEV) {
		mod = await $__global.reactServer.ssrLoadModule(
			"/src/integrations/flight/server",
		);
	} else {
		mod = await import("/dist/server/index.js" as string);
	}
	return mod;
}
