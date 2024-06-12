declare module "react-dom/server.edge" {
	export * from "react-dom/server";

	// https://github.com/facebook/react/blob/fb57fc5a8a66f38d65e3bc9f83213a0003da5702/packages/react-dom/src/server/ReactDOMFizzServerEdge.js#L165
	export function resume(
		children: React.ReactNode,
		postponed: object,
		opitons?: {},
	): Promise<ReadableStream<Uint8Array>>;
}

// https://github.com/facebook/react/blob/fb57fc5a8a66f38d65e3bc9f83213a0003da5702/packages/react-dom/src/server/ReactDOMFizzStaticEdge.js#L63
declare module "react-dom/static.edge" {
	export function prerender(
		children: React.ReactNode,
		opitons?: {},
	): Promise<{
		postponed: null | object;
		prelude: ReadableStream<Uint8Array>;
	}>;
}
