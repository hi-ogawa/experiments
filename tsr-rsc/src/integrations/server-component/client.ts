import { objectHas } from "@hiogawa/utils";
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
export type FlightData<T = unknown> = {
	__flight: true;
	f: string;
	revived?: T;
};

export function isFlightData(v: unknown): v is FlightData {
	return objectHas(v, "__flight") && v.__flight === true;
}

const flightMap = new WeakMap<FlightData, Promise<unknown>>();

function resolveFlightMap(data: FlightData) {
	let found = flightMap.get(data);
	if (!found) {
		found = reviveFlightClient(data);
		flightMap.set(data, found);
	}
	return found;
}

export async function reviveFlightClient(data: FlightData) {
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

export async function reviveFlightClientJson(data: unknown) {
	return applyReviverAsync(data, async (_k, v) => {
		if (isFlightData(v)) {
			const revived = await reviveFlightClient(v);
			return { ...v, revived };
		}
		return v;
	});
}

export const stripFlightClientReplacer: Replacer = function (k, v) {
	if (isFlightData(v)) {
		const { revived, ...rest } = v;
		return rest;
	}
	return v;
};

// cf.
// https://github.com/hi-ogawa/js-utils/blob/e38af9ce06108056b85ec553b0f090610950a599/packages/json-extra/src/index.ts
type Reviver = (k: string, v: unknown) => Promise<unknown>;
type Replacer = (this: unknown, k: keyof any, vToJson: unknown) => unknown;

function applyReviverAsync(data: unknown, reviver: Reviver) {
	async function recurse(v: unknown) {
		if (v && typeof v === "object") {
			v = Array.isArray(v) ? [...v] : { ...v };
			for (const [k, e] of Object.entries(v as any)) {
				(v as any)[k] = await recurse(e);
			}
		}
		return reviver("", v);
	}
	return recurse(data);
}
