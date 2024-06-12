import ReactDOMServer from "react-dom/server.edge";
import { App } from "./app";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ssrContextStorage } from "./context";

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	const htmlStream = await ssrContextStorage.run({ req }, () =>
		ReactDOMServer.renderToReadableStream(<App />),
	);
	res.setHeader("content-type", "text/html");
	Readable.fromWeb(htmlStream as any).pipe(res);
}
