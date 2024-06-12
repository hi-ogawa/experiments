import ReactDOMServer from "react-dom/server.edge";
import ReactDOMStatic from "react-dom/static.edge";
import { App } from "./app";
import { ssrContextStorage } from "./context";
import { webToNodeHandler } from "@hiogawa/utils-node";

export default webToNodeHandler(handler);

export async function handler(request: Request) {
	const url = new URL(request.url);
	if (url.searchParams.has("prerender")) {
		const { postponed, prelude } = await ssrContextStorage.run(
			{ request, mode: "prerender" },
			() => ReactDOMStatic.prerender(<App />),
		);
		console.log({ postponed });
		if (url.searchParams.has("resume") && postponed) {
			const resumed = await ssrContextStorage.run(
				{ request, mode: "resume" },
				() => ReactDOMServer.resume(<App />, postponed),
			);
			resumed;
			return new Response(prelude, {
				headers: {
					"content-type": "text/html;charset=utf-8",
				},
			});
		}
		return new Response(prelude, {
			headers: {
				"content-type": "text/html;charset=utf-8",
			},
		});
	}

	const htmlStream = await ssrContextStorage.run(
		{ request, mode: "render" },
		() => ReactDOMServer.renderToReadableStream(<App />),
	);
	return new Response(htmlStream, {
		headers: {
			"content-type": "text/html;charset=utf-8",
		},
	});
}
