import { tinyassert } from "@hiogawa/utils";
import { createMemoryHistory } from "@tanstack/react-router";
import { StartServer } from "@tanstack/start/server";
import ReactDOMServer from "react-dom/server.edge";
import { stripRevivedFlightRecursive } from "./integrations/flight/client";
import { handleFlight } from "./integrations/flight/ssr";
import { $__global } from "./integrations/global";
import { streamToString } from "./integrations/utils";
import { createRouter } from "./router";

export async function handler(request: Request) {
	const url = new URL(request.url);
	if (url.pathname === "/__flight") {
		const reference = url.searchParams.get("reference");
		tinyassert(reference);
		const args = await request.json();
		const data = await handleFlight(reference, args);
		return new Response(JSON.stringify(data), {
			headers: {
				"content-type": "application/json",
			},
		});
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
		throw new Error("todo");
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