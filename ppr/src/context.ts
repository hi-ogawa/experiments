import { AsyncLocalStorage } from "node:async_hooks";

type SsrContext = {
	request: Request;
	mode: "render" | "prerender" | "resume";
};

export const ssrContextStorage = new AsyncLocalStorage<SsrContext>();

// per-request cache
const cache = new WeakMap<object, any>();

export function useCache() {
	const { request } = ssrContextStorage.getStore()!;
	if (!cache.has(request)) {
		cache.set(request, {});
	}
	return cache.get(request);
}
