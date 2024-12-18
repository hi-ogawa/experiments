import ReactServer from "@jacob-ebey/react-server-dom-vite/server";
import { App } from "./app";
import { fromPipeableToWebReadable } from "./utils/fetch";

export interface RscHandlerResult {
	stream: ReadableStream<Uint8Array>;
}

export interface ServerPayload {
	root: React.ReactNode;
}

export async function handler(request: Request): Promise<RscHandlerResult> {
	request;
	const stream = fromPipeableToWebReadable(
		ReactServer.renderToPipeableStream<ServerPayload>(
			{
				root: <App />,
			},
			{
				resolveClientReferenceMetadata(metadata) {
					// console.log("[debug:resolveClientReferenceMetadata]", { metadata }, Object.getOwnPropertyDescriptors(metadata));
					return [metadata.$$id];
				},
			},
			{},
		),
	);
	return {
		stream,
	};
}
