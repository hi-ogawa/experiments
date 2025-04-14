// for react edge build's request context support e.g.
// https://github.com/facebook/react/blob/f14d7f0d2597ea25da12bcf97772e8803f2a394c/packages/react-server/src/forks/ReactFlightServerConfig.dom-edge.js#L16-L19
// for cloudflare deploy, need to inject `import "node:async_hooks"` as esbuild banner
if (!("AsyncLocalStorage" in globalThis)) {
	const { AsyncLocalStorage } = require("node:async_hooks");
	Object.assign(globalThis, { AsyncLocalStorage });
}
