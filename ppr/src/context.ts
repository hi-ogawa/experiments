import type { IncomingMessage } from "node:http";
import { AsyncLocalStorage } from "node:async_hooks";
import React from "react";

type SsrContext = {
	req: IncomingMessage;
};

export const ssrContextStorage = new AsyncLocalStorage<SsrContext>();

const pormiseMap = new WeakMap<object, Promise<any>>();

export function usePromise<T>(f: () => Promise<T>): T {
	const { req } = ssrContextStorage.getStore();
	let promise = pormiseMap.get(req);
	if (!promise) {
		promise = f();
		pormiseMap.set(req, promise);
	}
	return React.use(promise);
}
