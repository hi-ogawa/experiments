/// <reference types="vite/client" />

declare module "@jacob-ebey/react-server-dom-vite/server" {
	export function renderToPipeableStream<T>(
		data: T,
		manifest: {
			// biome-ignore format:
			resolveClientReferenceMetadata: import(".").ResolveClientReferenceMetadataFn;
		},
		opitons?: unknown,
	): import("react-dom/server").PipeableStream;

	export function decodeReply(body: string | FormData): Promise<unknown[]>;

	export function decodeAction(
		body: FormData,
		manifest: import(".").ServerReferenceManifest,
	): Promise<() => Promise<unknown>>;

	export function decodeFormState(
		returnValue: unknown,
		body: FormData,
		manifest: import(".").ServerReferenceManifest,
	): Promise<import("react-dom/client").ReactFormState>;
}

declare module "@jacob-ebey/react-server-dom-vite/client" {
	export function createFromNodeStream<T>(
		stream: import("node:stream").Readable,
		manifest: {
			resolveClientReference: import(".").ResolveClientReferenceFn;
		},
	): Promise<T>;

	export function createFromReadableStream<T>(
		stream: ReadableStream,
		manifest: {
			resolveClientReference: import(".").ResolveClientReferenceFn;
		},
		options: {
			callServer: import(".").CallServerFn;
		},
	): Promise<T>;

	export function createFromFetch<T>(
		fetchReturn: ReturnType<typeof fetch>,
		manifest: unknown,
		options: {
			callServer: import(".").CallServerFn;
		},
	): Promise<T>;

	export function encodeReply(v: unknown[]): Promise<string | FormData>;
}

declare module "virtual:ssr-assets" {
	export const bootstrapModules: string[];
}

declare module "virtual:build-rsc-entry" {
	export {};
}

declare module "virtual:build-client-references" {
	const value: Record<string, () => Promise<Record<string, unknown>>>;
	export default value;
}
