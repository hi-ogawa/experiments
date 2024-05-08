import "./style.css";
import "highlight.js/styles/github.css";
import { tinyassert } from "@hiogawa/utils";
import { createSSRApp, defineComponent, provide, readonly, ref } from "vue";
import { type SerializeResult, deserialize } from "../serialize";
import * as referenceMap from "./routes/_client";

function main() {
	if (window.location.search.includes("__nojs")) {
		return;
	}

	const initResult: SerializeResult = (globalThis as any).__serialized;

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
			serialized.value = await res.json();
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
}

function listenHistory(onNavigation: () => void) {
	window.addEventListener("pushstate", onNavigation);
	window.addEventListener("popstate", onNavigation);

	const oldPushState = window.history.pushState;
	window.history.pushState = function (...args) {
		const res = oldPushState.apply(this, args);
		onNavigation();
		return res;
	};

	const oldReplaceState = window.history.replaceState;
	window.history.replaceState = function (...args) {
		const res = oldReplaceState.apply(this, args);
		onNavigation();
		return res;
	};

	return () => {
		window.removeEventListener("pushstate", onNavigation);
		window.removeEventListener("popstate", onNavigation);
		window.history.pushState = oldPushState;
		window.history.replaceState = oldReplaceState;
	};
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
