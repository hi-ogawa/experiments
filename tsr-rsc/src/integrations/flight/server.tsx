import ReactServer from "react-server-dom-webpack/server.edge";

export async function handler(reference: string, args: any[]) {
	const [id, name] = reference.split("#");
	const mod = await import(/* @vite-ignore */ id);
	const result = await mod[name](...args);
	return ReactServer.renderToReadableStream(result, createBundlerConfig());
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
