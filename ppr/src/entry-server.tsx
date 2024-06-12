import ReactDOMServer from "react-dom/server.edge";
import ReactDOMStatic from "react-dom/static.edge";
import { App } from "./app";
import { ssrContextStorage } from "./context";

// TODO: demo (add link for each case?)
// - [x] full ssr
// - [x] prerender only
// - [x] prerender + resume
// - [ ] resume with prebuilt prerender

export async function handler(request: Request) {
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
					"content-type": "text/html",
				},
			});
		}
		return new Response(prelude, {
			headers: {
				"content-type": "text/html",
			},
		});
	}

	if (import.meta.env.PROD && url.searchParams.has("ppr")) {
		// @ts-expect-error injected by plugin
		const { preludeHtml, postponed } = __PPR_BUILD__;
		const resumed = await ssrContextStorage.run(
			{ request, mode: "resume" },
			() => ReactDOMServer.resume(<App />, postponed),
		);
		const merged = resumed.pipeThrough(
			new TransformStream({
				start(controller) {
					controller.enqueue(new TextEncoder().encode(preludeHtml));
				},
			}),
		);
		return new Response(merged, {
			headers: {
				"content-type": "text/html",
			},
		});
	}

	const htmlStream = await ssrContextStorage.run(
		{ request, mode: "render" },
		() => ReactDOMServer.renderToReadableStream(<App />),
	);
	return new Response(htmlStream, {
		headers: {
			"content-type": "text/html",
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
