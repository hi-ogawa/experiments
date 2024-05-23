import { createMemoryHistory } from "@tanstack/react-router";
import { StartServer } from "@tanstack/start/server";
import ReactDOMServer from "react-dom/server.edge";
import {
	importPromiseCache,
	stripRevivedFlightRecursive,
} from "./integrations/flight/client";
import { handleFlightRequest } from "./integrations/flight/ssr";
import { $__global } from "./integrations/global";
import { streamToString } from "./integrations/utils";
import { createRouter } from "./router";

export async function handler(request: Request) {
	if (import.meta.env.DEV) {
		importPromiseCache.clear();
	}

	const url = new URL(request.url);
	if (url.pathname === "/__flight") {
		return handleFlightRequest(request);
	}

	const router = createRouter();

	const memoryHistory = createMemoryHistory({
		initialEntries: [url.pathname],
	});

	router.update({
		history: memoryHistory,
		context: router.options.context,
	});
	await router.load();

	const ssrStream = await ReactDOMServer.renderToReadableStream(
		<StartServer router={router} />,
	);
	const ssrHtml = await streamToString(ssrStream);

	let html = await importIndexHtml();
	html = html.replace("<body>", () => `<body><div id="root">${ssrHtml}</div>`);

	const dehydratedState = { router: router.dehydrate() };
	const dehydratedStateScript = escpaeScriptString(
		JSON.stringify(stripRevivedFlightRecursive(dehydratedState)),
	);
	html = html.replace(
		`<head>`,
		() =>
			`<head><script>window.__ssr_dehydrated_state__ = ${dehydratedStateScript}</script>`,
	);
	if (import.meta.env.DEV) {
		// fix FOUC
		html = html.replace(
			`<head>`,
			() => `<head><link rel="stylesheet" href="/src/styles.css?direct" />`,
		);
	}
	return new Response(html, {
		headers: {
			"content-type": "text/html",
		},
	});
}

async function importIndexHtml() {
	if (import.meta.env.DEV) {
		const mod = await import("/index.html?raw");
		return await $__global.ssrServer.transformIndexHtml("/", mod.default);
	} else {
		const mod = await import("/dist/browser/index.html?raw");
		return mod.default;
	}
}

// https://github.com/remix-run/remix/blob/7f30f0bc976f0b97a020e81be33f90f68d4e527a/packages/remix-server-runtime/markup.ts#L7-L16
function escpaeScriptString(s: string) {
	return s.replace(ESCAPE_REGEX, (s) => ESCAPE_LOOKUP[s as "&"]);
}

const ESCAPE_LOOKUP = {
	"&": "\\u0026",
	">": "\\u003e",
	"<": "\\u003c",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029",
};

const ESCAPE_REGEX = /[&><\u2028\u2029]/g;
