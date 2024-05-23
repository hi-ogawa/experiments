import { memoize, objectHas, tinyassert } from "@hiogawa/utils";
import { stringToStream } from "../utils";

export function createFlightLoader(reference: string) {
	return async (...args: any[]) => {
		let data: FlightData;
		if (import.meta.env.SSR) {
			const { handleFlight } = await import("./ssr");
			data = await handleFlight(reference, args);
		} else {
			const res = await fetch(
				"/__flight?reference=" + encodeURIComponent(reference),
				{
					method: "POST",
					body: JSON.stringify(args),
				},
			);
			tinyassert(res.ok);
			data = await res.json();
		}
		const revived = await reviveFlight(data);
		// inject raw flight data for ssr + hydration
		// TODO: for now, it requires object to be able to inject flight
		//       we can probably try custom context to hydrate flight on my own
		tinyassert(revived && typeof revived === "object");
		if (import.meta.env.SSR) {
			Object.defineProperties(revived, {
				[FLIGHT_KEY]: {
					enumerable: false,
					value: data[FLIGHT_KEY],
				},
			});
		}
		return revived;
	};
}

export const FLIGHT_KEY = "__flight";

export type FlightData = {
	[FLIGHT_KEY]: string;
};

function isFlightData(v: unknown): v is FlightData {
	return objectHas(v, FLIGHT_KEY);
}

// TODO: invalidate, normalize id, etc...
async function importClientReference(id: string) {
	if (import.meta.env.DEV) {
		return import(/* @vite-ignore */ id);
	} else {
		const mod = await import("virtual:client-references" as string);
		return mod.default[id]();
	}
}

export const importPromiseCache = new Map();

(globalThis as any).__webpack_require__ = memoize(importClientReference, {
	cache: importPromiseCache,
});

async function reviveFlight(data: FlightData) {
	const stream = stringToStream(data[FLIGHT_KEY]);
	if (import.meta.env.SSR) {
		const { default: ReactClient } = await import(
			"react-server-dom-webpack/client.edge"
		);
		return ReactClient.createFromReadableStream(stream, {
			ssrManifest: {},
		});
	} else {
		const { default: ReactClient } = await import(
			"react-server-dom-webpack/client.browser"
		);
		return ReactClient.createFromReadableStream(stream, {
			callServer: undefined,
		});
	}
}

export async function reviveFlightRecursive(data: unknown) {
	return applyReviverAsync(data, async (_k, v) => {
		if (isFlightData(v)) {
			return reviveFlight(v);
		}
		return v;
	});
}

export function stripRevivedFlightRecursive(data: unknown) {
	return applyReplacer(data, (_k, v) => {
		if (isFlightData(v)) {
			return { [FLIGHT_KEY]: v[FLIGHT_KEY] };
		}
		return v;
	});
}

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

function applyReplacer(data: unknown, replacer: Replacer) {
	function recurse(v: unknown) {
		const vToJson =
			v &&
			typeof v === "object" &&
			"toJSON" in v &&
			typeof v.toJSON === "function"
				? v.toJSON()
				: v;
		v = replacer.apply([v], [0, vToJson]);
		if (v && typeof v === "object") {
			v = Array.isArray(v) ? [...v] : { ...v };
			for (const [k, e] of Object.entries(v as any)) {
				(v as any)[k] = recurse(e);
			}
		}
		return v;
	}
	return recurse(data);
}
