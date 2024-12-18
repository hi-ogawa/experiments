/// <reference types="vite/client" />

declare module "@jacob-ebey/react-server-dom-vite/server" {
	export function renderToPipeableStream<T>(
		data: T,
		manifest: {
			resolveClientReferenceMetadata(metadata: { $$id: string }): [string];
		},
		opitons?: unknown,
	): import("react-dom/server").PipeableStream;

	// export function registerClientReference<T>(
	// 	proxy: T,
	// 	id: string,
	// 	name: string,
	// ): T;

	// export function registerServerReference<T>(
	// 	ref: T,
	// 	id: string,
	// 	name: string,
	// ): T;

	// export function decodeReply(body: string | FormData): Promise<unknown[]>;

	// export function decodeAction(
	// 	body: FormData,
	// 	bundlerConfig: import(".").BundlerConfig,
	// ): Promise<() => Promise<unknown>>;

	// export function decodeFormState(
	// 	actionResult: unknown,
	// 	body: FormData,
	// 	serverManifest?: unknown,
	// ): Promise<unknown>;
}

declare module "@jacob-ebey/react-server-dom-vite/client" {
	export function createFromNodeStream<T>(
		stream: import("node:stream").Readable,
		manifest: {
			resolveClientReference(reference: [string]): {
				preload(): Promise<void>;
				get(): unknown;
			};
		},
	): Promise<T>;

	export function createFromReadableStream<T>(
		stream: ReadableStream,
		manifest: {
			resolveClientReference(reference: [string]): {
				preload(): Promise<void>;
				get(): unknown;
			};
		},
	): Promise<T>;

	export function createFromFetch<T>(
		fetchReturn: ReturnType<typeof fetch>,
		manifest: unknown,
	): Promise<T>;
}

declare module "virtual:ssr-assets" {
	export const bootstrapModules: string[];
}

declare module "virtual:build-rsc-entry" {
	export {};
}
