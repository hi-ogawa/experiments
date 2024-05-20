import ReactServer from "react-server-dom-webpack/server.edge";

export async function render(data: unknown) {
	return ReactServer.renderToReadableStream(data, createBundlerConfig());
}

function createBundlerConfig() {
	return new Proxy(
		{},
		{
			get(_target, p: string, _receiver) {
				const [id, name] = p.split("#");
				return { id, name, chunks: [] };
			},
		},
	);
}
