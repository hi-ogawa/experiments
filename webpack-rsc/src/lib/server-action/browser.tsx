import ReactClient from "react-server-dom-webpack/client.browser";
import { $__global } from "../global";

export function createServerReference(id: string, name: string) {
	return ReactClient.createServerReference(id + "#" + name, (...args) =>
		$__global.__f_call_server(...args),
	);
}
