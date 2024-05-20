import { createMemoryHistory } from "@tanstack/react-router";
import { StartServer } from "@tanstack/start/server";
import ReactDOMServer from "react-dom/server.edge";
import { $__global } from "./integrations/global";
import { streamToString } from "./integrations/utils";
import { createRouter } from "./router";

export async function handler(request: Request) {
	const url = new URL(request.url);
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

export async function $$flight(data: unknown) {
	const reactServer = await importReactServer();
	const stream = await reactServer.render(data);
	return await streamToString(stream);
}

async function importReactServer(): Promise<typeof import("./entry-server")> {
	let mod: any;
	if (import.meta.env.DEV) {
		mod = await $__global.reactServer.ssrLoadModule("/src/entry-server");
	} else {
		throw new Error("todo");
	}
	return mod;
}
