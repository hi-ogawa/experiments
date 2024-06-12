import { AsyncLocalStorage } from "node:async_hooks";
import React from "react";

type SsrContext = {
	request: Request;
	prerender?: boolean;
};

export const ssrContextStorage = new AsyncLocalStorage<SsrContext>();

const pormiseMap = new WeakMap<object, Promise<any>>();

export function usePromise<T>(f: () => Promise<T>): T {
	const ctx = ssrContextStorage.getStore();
	let promise = pormiseMap.get(ctx);
	if (!promise) {
		promise = f();
		pormiseMap.set(ctx, promise);
	}
	return React.use(promise);
}

export function usePostpone() {
	// @ts-expect-error
	React.unstable_postpone();
}
