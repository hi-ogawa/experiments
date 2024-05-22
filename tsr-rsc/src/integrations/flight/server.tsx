import ReactServer from "react-server-dom-webpack/server.edge";

export async function handler(reference: string, args: any[]) {
	const [id, name] = reference.split("#");
	const mod = await importServerReference(id);
	const result = await mod[name](...args);
	return ReactServer.renderToReadableStream(result, createBundlerConfig());
}

async function importServerReference(id: string) {
	if (import.meta.env.DEV) {
		return import(/* @vite-ignore */ id);
	} else {
		const mod = await import("virtual:server-references" as string);
		return mod.default[id]();
	}
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

export function registerClientReference(id: string, name: string) {
	// mostly reuse everything with { $$async: true }
	const reference = ReactServer.registerClientReference({}, id, name);
	return Object.defineProperties(
		{},
		{
			...Object.getOwnPropertyDescriptors(reference),
			$$async: { value: true },
		},
	);
}
