import type http from "node:http";
import ReactDOMServer from "react-dom/server.edge";
import { App } from "./app";
import { Readable } from "node:stream";

export default async function handler(
	_req: http.IncomingMessage,
	res: http.ServerResponse,
) {
	const htmlStream = await ReactDOMServer.renderToReadableStream(<App />);
	res.setHeader("content-type", "text/html");
	Readable.fromWeb(htmlStream as any).pipe(res);
}
