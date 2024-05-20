import type { ViteDevServer } from "vite";

export const $__global: {
	ssrServer: ViteDevServer;
	reactServer: ViteDevServer;
} = ((globalThis as any).__VITE_REACT_SERVER_GLOBAL ??= {});
