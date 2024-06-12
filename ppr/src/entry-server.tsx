import ReactDOMServer from "react-dom/server.edge";
import ReactDOMStatic from "react-dom/static.edge";
import { App } from "./app";
import { ssrContextStorage } from "./context";
import { webToNodeHandler } from "@hiogawa/utils-node";

export default webToNodeHandler(handler);

// TODO: demo (add link for each case?)
// - [x] full ssr
// - [x] prerender only
// - [x] prerender + resume
// - [ ] resume with prebuilt prerender

async function handler(request: Request) {
	const url = new URL(request.url);
	if (url.searchParams.has("prerender")) {
		const { postponed, prelude } = await prerender(request);
		if (url.searchParams.has("resume") && postponed) {
			const resumed = await ssrContextStorage.run(
				{ request, mode: "resume" },
				() => ReactDOMServer.resume(<App />, postponed),
			);
			return new Response(concatStreams([prelude, resumed]), {
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

export async function prerender(request: Request) {
	return await ssrContextStorage.run({ request, mode: "prerender" }, () =>
		ReactDOMStatic.prerender(<App />),
	);
}

function concatStreams(streams: ReadableStream<Uint8Array>[]) {
	return new ReadableStream<Uint8Array>({
		async start(controller) {
			for (const stream of streams) {
				for await (const c of stream as any) {
					controller.enqueue(c);
				}
			}
			controller.close();
		},
	});
}
