import { tinyassert } from "@hiogawa/utils";
import { createSSRApp } from "vue";
import { type SerializeResult, deserialize } from "../serialize";

function main() {
	const initResult: SerializeResult = (globalThis as any).__serialized;
	const Root = () => deserialize(initResult.data, {});
	const app = createSSRApp(Root);
	const el = document.getElementById("root");
	tinyassert(el);
	app.mount(el);
}

main();
