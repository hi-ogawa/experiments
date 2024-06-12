import { webToNodeHandler } from "@hiogawa/utils-node";
import { handler } from "../entry-server";

export default webToNodeHandler(handler);

import http from "node:http";

if (globalThis.process?.env["__RUN_SERVER"]) {
	const nodeHandler = webToNodeHandler(handler);
	const server = http.createServer((req, res) =>
		nodeHandler(req, res, (error) => {
			console.error(error);
		}),
	);
	server.listen(4444, () => {
		console.log(":: listening at http://localhost:4444");
	});
}
