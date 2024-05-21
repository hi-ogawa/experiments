import { objectHas, tinyassert } from "@hiogawa/utils";
import { stringToStream } from "../utils";

export function createFlightLoader(reference: string) {
	return async () => {
		let data: FlightData;
		if (import.meta.env.SSR) {
			const { handleFlight } = await import("./ssr");
			data = await handleFlight(reference);
		} else {
			const res = await fetch(
				"/__flight?reference=" + encodeURIComponent(reference),
			);
			tinyassert(res.ok);
			data = await res.json();
		}
		const revived = (await reviveFlightClient(data)) as any;
		return { ...data, revived };
	};
}

export type FlightData<T = unknown> = {
	__flight: true;
	f: string;
	revived?: T;
};

function isFlightData(v: unknown): v is FlightData {
	return objectHas(v, "__flight") && v.__flight === true;
}

async function reviveFlightClient(data: FlightData) {
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

export const stripFlightClientReplacer: Replacer = function (_k, v) {
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
