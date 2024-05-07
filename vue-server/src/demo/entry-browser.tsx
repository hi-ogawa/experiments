import "./style.css";
import { tinyassert } from "@hiogawa/utils";
import { createSSRApp } from "vue";
import { type SerializeResult, deserialize } from "../serialize";
import { ClientCounter, ClientNested, ClientSfc } from "./routes/_client";

function main() {
	const initResult: SerializeResult = (globalThis as any).__serialized;
	const Root = () =>
		deserialize(initResult.data, { ClientCounter, ClientNested, ClientSfc });
	const app = createSSRApp(Root);
	const el = document.getElementById("root");
	tinyassert(el);

	listenHydrationMismatch(() => {
		document.title = "🚨 HYDRATE ERROR";
	});
	app.mount(el);
}

// patch console to notify hydration error
function listenHydrationMismatch(f: () => void) {
	const prev = console.error;
	console.error = function (...args) {
		if (
			typeof args[0] === "string" &&
			args[0].includes("Hydration completed but contains mismatches")
		) {
			f();
		}
		prev.apply(this, args);
	};
}

main();
