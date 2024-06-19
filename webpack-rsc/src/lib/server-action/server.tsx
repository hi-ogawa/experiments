import { tinyassert } from "@hiogawa/utils";
import ReactServer from "react-server-dom-webpack/server.edge";
import { getServerManifest } from "../server-manifest";

export type ActionResult = unknown;

export async function actionHandler(request: Request): Promise<ActionResult> {
	const url = new URL(request.url);
	const { serverManifest } = await getServerManifest();
	let boundAction: Function;
	if (url.searchParams.has("__f")) {
		// client stream request
		const contentType = request.headers.get("content-type");
		const body = contentType?.startsWith("multipart/form-data")
			? await request.formData()
			: await request.text();
		const args = await ReactServer.decodeReply(body);
		const $$id = url.searchParams.get("__a");
		tinyassert($$id);
		const entry = serverManifest[$$id];
		// @ts-expect-error
		const mod = __webpack_require__(entry.id);
		// TODO: export tree shaken...
		console.log({ $$id, entry, mod });
		boundAction = () => mod[entry.name](...args);
	} else {
		// progressive enhancement
		const formData = await request.formData();
		const decodedAction = await ReactServer.decodeAction(
			formData,
			serverManifest,
		);
		boundAction = async () => {
			const result = await decodedAction();
			const formState = await ReactServer.decodeFormState(result, formData);
			return formState;
		};
	}
	return boundAction();
}
