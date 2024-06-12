import ReactDOMServer from "react-dom/server.edge";
import { App } from "./app";
import { ssrContextStorage } from "./context";
import { webToNodeHandler } from "@hiogawa/utils-node";

export default webToNodeHandler(handler);

export async function handler(request: Request) {
	const htmlStream = await ssrContextStorage.run({ request }, () =>
		ReactDOMServer.renderToReadableStream(<App />),
	);
	return new Response(htmlStream, {
		headers: {
			"content-type": "text/html;charset=utf-8",
		},
	});
}
