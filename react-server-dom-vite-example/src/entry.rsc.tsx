import ReactServer from "@jacob-ebey/react-server-dom-vite/server";
import { App } from "./app";
import { fromPipeableToWebReadable } from "./utils/server";

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
			{},
			{},
		),
	);
	return {
		stream,
	};
}
