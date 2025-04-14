import "./entry-ssr-init";
import React from "react";
import ReactDOMServer from "react-dom/server.edge";
import ReactClient from "react-server-dom-webpack/client.edge";
import type { FlightData } from "./entry-server";
import * as entryReactServer from "./entry-server-layer";
import { getClientAssets } from "./lib/client-assets";
import { getClientManifest } from "./lib/client-manifest";
import { injectFlightStream } from "./lib/ssr-stream";
import GlobalErrorPage from "./routes/global-error";

export async function handler(request: Request) {
	const url = new URL(request.url);

	// react server (react node -> flight)
	const { flightStream, actionResult } =
		await entryReactServer.handler(request);
	if (url.searchParams.has("__f")) {
		return new Response(flightStream, {
			headers: {
				"content-type": "text/x-component;charset=utf-8",
			},
		});
	}

	const [flightStream1, flightStream2] = flightStream.tee();

	const assets = await getClientAssets();
	const links = (
		<>
			{assets.css.map((href) => (
				<link
					key={href}
					rel="stylesheet"
					href={href}
					// @ts-expect-error precedence to force head rendering
					// https://react.dev/reference/react-dom/components/link#special-rendering-behavior
					precedence="high"
				/>
			))}
		</>
	);

	// react client (flight -> react node)
	const { ssrManifest } = await getClientManifest();

	let flightData: Promise<FlightData>;

	function SsrRoot() {
		// flight deserialization needs to be kicked in inside SSR context
		// for react-dom preinit/preloading to work
		flightData ??= ReactClient.createFromReadableStream<FlightData>(
			flightStream1,
			{ ssrManifest },
		);
		return (
			<>
				{React.use(flightData).node}
				{links}
			</>
		);
	}

	// react dom ssr (react node -> html)
	let status = 200;
	let htmlStream: ReadableStream<Uint8Array>;
	try {
		htmlStream = await ReactDOMServer.renderToReadableStream(<SsrRoot />, {
			bootstrapScripts: assets.bootstrapScripts,
			formState: actionResult,
		});
	} catch (e) {
		// two-pass render for ssr error
		status = 500;
		const errorRoot = (
			<>
				<GlobalErrorPage />
				<script dangerouslySetInnerHTML={{ __html: "self.__nossr = true" }} />
				{links}
			</>
		);
		htmlStream = await ReactDOMServer.renderToReadableStream(errorRoot, {
			bootstrapScripts: assets.bootstrapScripts,
		});
	}

	const htmlStreamFinal = htmlStream
		.pipeThrough(new TextDecoderStream())
		// send a copy of flight stream together with ssr
		.pipeThrough(injectFlightStream(flightStream2))
		.pipeThrough(new TextEncoderStream());

	return new Response(htmlStreamFinal, {
		status,
		headers: {
			"content-type": "text/html;charset=utf-8",
		},
	});
}

declare module "react-dom/server" {
	interface RenderToReadableStreamOptions {
		formState?: unknown;
	}
}
