import type { ResolvedConfig, ViteDevServer } from "vite";

export const $__global: {
	ssrServer: ViteDevServer;
	reactServer: ViteDevServer;
	config: ResolvedConfig;
	clientRefereneIds: Set<string>;
} = ((globalThis as any).__VITE_REACT_SERVER_GLOBAL ??= {});
