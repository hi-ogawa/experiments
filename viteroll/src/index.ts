// @ts-ignore
import virtualTest from "virtual:test";
import { h, render } from "preact";
import { useState } from "preact/hooks";
import { depHmr } from "./dep-hmr";

// TODO: `declare` prevents define replacement
// https://github.com/oxc-project/oxc/issues/7090
// declare let __TEST_DEFINE__: any;

function App() {
	const [count, setCount] = useState(0);
	return h(
		"div",
		{},
		h("h3", {}, "Test"),
		h("button", { onClick: () => setCount((c) => c + 1) }, `Count: ${count}`),
		h("p", {}, `[dep-hmr.ts] `, depHmr),
		h(
			"p",
			{},
			`[define] `,
			// @ts-expect-error
			typeof __TEST_DEFINE__ !== "undefined" ? __TEST_DEFINE__ : "NOT OK",
		),
		h("p", {}, `[virtual:test] `, virtualTest),
	);
}

function main() {
	render(h(App, null), document.getElementById("root")!);
}

main();

// quick and dirty HMR
(globalThis as any).__hmr = main;
