export let depHmr = "Edit me!";

if (module.hot) {
	// quick and dirty HMR runtime similar to
	// https://github.com/hi-ogawa/vite-plugins/tree/main/packages/vite-plugin-simple-hmr
	const registry = ((globalThis as any).__registry ??= {
		updators: [],
		latest: undefined,
	});
	registry.updators.push(() => (depHmr = registry.latest));
	registry.latest = depHmr;

	module.hot.accept(() => {
		registry.updators.forEach((f: any) => f());
		(globalThis as any).__main();
	});
}
