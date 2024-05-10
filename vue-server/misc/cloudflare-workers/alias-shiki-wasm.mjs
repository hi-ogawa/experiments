export default async (info) => {
	const mod = await import("./shiki.wasm");
	return WebAssembly.instantiate(mod.default, info);
};
