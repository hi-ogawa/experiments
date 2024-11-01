import { h, render } from "preact";
import { useState } from "preact/hooks";
import { depHmr } from "./dep-hmr";

function App() {
	const [count, setCount] = useState(0);
	return h(
		"div",
		{},
		h("h3", {}, "Test"),
		h("button", { onClick: () => setCount((c) => c + 1) }, `Count: ${count}`),
		h("p", {}, `[dep-hmr.ts] `, depHmr),
	);
}

function main() {
	render(h(App, null), document.getElementById("root")!);
}

main();

// quick and dirty HMR
(globalThis as any).__main = main;

// TODO: no top level await?
(async () => {
	const { createHotContext } = await import(String("/@vite/client"));
	const hot = createHotContext("/__rolldown");
	hot.on("rolldown-hmr-update", (data: any) => {
		(0, eval)(data[1]);
	});
})();
