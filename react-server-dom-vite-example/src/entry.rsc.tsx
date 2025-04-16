import {
	clientReferenceMetadataManifest,
	getServerReferenceManifest,
	loadServerAction,
	setRequireModule,
} from "@vitejs/plugin-rsc/server";
import type { ReactFormState } from "react-dom/client";
import ReactServer from "react-server-dom-vite/server";
import { Router } from "./app/routes";
import { fromPipeableToWebReadable } from "./utils/fetch";

export interface RscHandlerResult {
	stream: ReadableStream<Uint8Array>;
}

export interface ServerPayload {
	root: React.ReactNode;
	formState?: ReactFormState;
	returnValue?: unknown;
}

export async function handler(
	url: URL,
	request: Request,
): Promise<RscHandlerResult> {
	setRequireModule(async (id: string) => {
		if (import.meta.env.DEV) {
			return await import(/* @vite-ignore */ id);
		} else {
			// @ts-ignore
			const references = await import("virtual:vite-rsc/server-references");
			return await references.default[id]();
		}
	});

	// handle action
	let returnValue: unknown | undefined;
	let formState: ReactFormState | undefined;
	if (request.method === "POST") {
		const actionId = url.searchParams.get("__rsc");
		if (actionId) {
			// client stream request
			const contentType = request.headers.get("content-type");
			const body = contentType?.startsWith("multipart/form-data")
				? await request.formData()
				: await request.text();
			const args = await ReactServer.decodeReply(body);
			const action = await loadServerAction(actionId);
			returnValue = await (action as any).apply(null, args);
		} else {
			// progressive enhancement
			const formData = await request.formData();
			const decodedAction = await ReactServer.decodeAction(
				formData,
				getServerReferenceManifest(),
			);
			formState = await ReactServer.decodeFormState(
				await decodedAction(),
				formData,
				getServerReferenceManifest(),
			);
		}
	}

	// render flight stream
	const stream = fromPipeableToWebReadable(
		ReactServer.renderToPipeableStream<ServerPayload>(
			{
				root: <Router url={url} />,
				returnValue,
				formState,
			},
			clientReferenceMetadataManifest,
			{},
		),
	);

	return {
		stream,
	};
}
