import "./style.css";
import { tinyassert } from "@hiogawa/utils";
import { createSSRApp, defineComponent, provide, readonly, ref } from "vue";
import { type SerializeResult, deserialize } from "../serialize";
import { createReferenceMap } from "./integrations/client-reference/runtime";
import { listenHistory } from "./integrations/router/browser";

async function main() {
	if (window.location.search.includes("__nojs")) {
		return;
	}

	const initResult: SerializeResult = (globalThis as any).__serialized;
	const referenceMap = await createReferenceMap(initResult.referenceIds);

	const Root = defineComponent(() => {
		const serialized = ref(initResult);
		const isLoading = ref(false);
		provide("isLoading", readonly(isLoading));

		listenHistory(async () => {
			isLoading.value = true;
			const url = new URL(window.location.href);
			url.searchParams.set("__serialize", "");
			const res = await fetch(url);
			tinyassert(res.ok);
			const result: SerializeResult = await res.json();
			Object.assign(
				referenceMap,
				await createReferenceMap(result.referenceIds),
			);
			serialized.value = result;
			isLoading.value = false;
		});

		return () => deserialize(serialized.value.data, referenceMap) as any;
	});

	const app = createSSRApp(Root);
	const el = document.getElementById("root");
	tinyassert(el);

	listenHydrationMismatch(() => {
		document.title = "🚨 HYDRATE ERROR";
	});
	app.mount(el);

	if (import.meta.hot) {
		import.meta.hot.on("vue-server:update", (e) => {
			console.log("[vue-server] hot update", e.file);
			window.history.replaceState({}, "", window.location.href);
		});
	}
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
