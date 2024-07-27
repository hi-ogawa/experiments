declare module "react-dom/server.edge" {
	export * from "react-dom/server";
}

declare module "react-server-dom-webpack/server.edge" {
	export function renderToReadableStream<T>(
		data: T,
		bundlerConfig: object,
		opitons?: import("react-dom/server").RenderToReadableStreamOptions,
	): ReadableStream<Uint8Array>;

	export function registerClientReference<T>(
		proxy: T,
		id: string,
		name: string,
	): T;

	export function registerServerReference<T>(
		ref: T,
		id: string,
		name: string,
	): T;

	export function decodeReply(body: string | FormData): Promise<unknown[]>;

	export function decodeAction(
		body: FormData,
		bundlerConfig: object,
	): Promise<() => Promise<unknown>>;

	export function decodeFormState(
		actionResult: unknown,
		body: FormData,
		serverManifest?: unknown,
	): Promise<unknown>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientEdge.js
declare module "react-server-dom-webpack/client.edge" {
	export function createServerReference(
		id: string,
		callServer: unknown,
	): Function;

	export function createFromReadableStream<T>(
		stream: ReadableStream<Uint8Array>,
		options: {
			ssrManifest: import("./react-types").SsrManifest;
		},
	): Promise<T>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientBrowser.js
declare module "react-server-dom-webpack/client.browser" {
	export function createServerReference(
		id: string,
		callServer: import("./react-types").CallServerCallback,
	): Function;

	export function createFromReadableStream<T>(
		stream: ReadableStream<Uint8Array>,
		options: {
			callServer: import("./react-types").CallServerCallback;
		},
	): Promise<T>;

	export function createFromFetch<T>(
		promiseForResponse: Promise<Response>,
		options: {
			callServer: import("./react-types").CallServerCallback;
		},
	): Promise<T>;

	export function encodeReply(v: unknown[]): Promise<string | FormData>;
}
