import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	res.write("hello: " + req.url);
	res.end();
}
