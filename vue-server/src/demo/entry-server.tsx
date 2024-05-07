import type { ViteDevServer } from "vite";
import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import { deserialize, serialize } from "../serialize";
import * as referenceMap from "./routes/_client";
import Layout from "./routes/layout";

export async function handler(request: Request) {
	const url = new URL(request.url);
	const result = await serialize(<Router url={url} />);

	if (url.searchParams.has("__serialize")) {
		return new Response(JSON.stringify(result), {
			headers: {
				"content-type": "application/json",
			},
		});
	}

	const Root = () => deserialize(result.data, referenceMap);
	const app = createSSRApp(Root);
	const ssrHtml = await renderToString(app);
	let html = await importHtmlTemplate();
	html = html.replace("<body>", () => `<div id="root">${ssrHtml}</div>`);
	html = html.replace(
		"<head>",
		() =>
			`<head><script>globalThis.__serialized = ${JSON.stringify(
				result,
			)}</script>`,
	);
	if (import.meta.env.DEV) {
		html = html.replace(
			"<head>",
			`<head><link rel="stylesheet" href="/src/demo/style.css?direct" />`,
		);
	}
	return new Response(html, {
		headers: {
			"content-type": "text/html",
		},
	});
}

const routes = {
	"/": () => import("./routes/page"),
	"/highlight": () => import("./routes/highlight/page"),
	"/slow": () => import("./routes/slow/page"),
};

const Router = defineComponent<{ url: URL }>(
	async (props) => {
		const route = routes[props.url.pathname as "/"];
		let slot = () => <div>Not Found</div>;
		if (route) {
			const Page = (await route()).default;
			slot = () => <Page />;
		}
		return () => <Layout>{slot}</Layout>;
	},
	{
		props: ["url"],
	},
);

declare let __vite_server: ViteDevServer;

async function importHtmlTemplate() {
	let html: string;
	if (import.meta.env.DEV) {
		html = (await import("/index.html?raw")).default;
		html = await __vite_server.transformIndexHtml("/", html);
	} else {
		html = (await import("/dist/client/index.html?raw")).default;
	}
	return html;
}
