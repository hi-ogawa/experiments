import "./style.css";
import { tinyassert } from "@hiogawa/utils";
import { createSSRApp } from "vue";
import { type SerializeResult, deserialize } from "../serialize";
import { ClientCounter } from "./routes/_client";

function main() {
	const initResult: SerializeResult = (globalThis as any).__serialized;
	const Root = () => deserialize(initResult.data, { ClientCounter });
	const app = createSSRApp(Root);
	const el = document.getElementById("root");
	tinyassert(el);
	app.mount(el);
}

main();
