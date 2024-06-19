import ReactClient from "react-server-dom-webpack/client.edge";

export function createServerReference(id: string, name: string) {
	return ReactClient.createServerReference(id + "#" + name, () => {});
}
