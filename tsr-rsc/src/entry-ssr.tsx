import { createMemoryHistory } from "@tanstack/react-router";
import { StartServer } from "@tanstack/start/server";
import ReactDOMServer from "react-dom/server.edge";
import { streamToString } from "./integrations/utils";
import { createRouter } from "./router";
import { flightLoader } from "./routes";

export async function handler(request: Request) {
	const url = new URL(request.url);
	if (url.pathname === "/__flight") {
		const data = await flightLoader();
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
	const html = await streamToString(ssrStream);
	return new Response(html, {
		headers: {
			"content-type": "text/html",
		},
	});
}
