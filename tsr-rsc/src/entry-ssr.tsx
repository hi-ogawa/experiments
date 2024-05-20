import { createMemoryHistory } from "@tanstack/react-router";
import { StartServer } from "@tanstack/start/server";
import ReactDOMServer from "react-dom/server";
import { createRouter } from "./router";

export async function handler(request: Request) {
	const url = new URL(request.url);
	const router = createRouter();

	const memoryHistory = createMemoryHistory({
		initialEntries: [url.pathname],
	});

	router.update({
		history: memoryHistory,
		context: {
			...router.options.context,
		},
	});

	await router.load();

	// TODO: stream
	const appHtml = ReactDOMServer.renderToString(
		<StartServer router={router} />,
	);

	return new Response(`<!DOCTYPE html>${appHtml}`, {
		headers: {
			"content-type": "text/html",
		},
	});
}
