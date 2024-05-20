import "./style.css";
import { tinyassert } from "@hiogawa/utils";
import {
	createSSRApp,
	defineComponent,
	provide,
	readonly,
	shallowRef,
} from "vue";
import { type SerializeResult, deserialize } from "../serialize";
import { createReferenceMap } from "./integrations/client-reference/runtime";
import { listenBrowserHistory } from "./integrations/router/browser";

async function main() {
	if (window.location.search.includes("__nojs")) {
		return;
	}

	const initResult: SerializeResult = (globalThis as any).__serialized;
	const initReferenceMap = await createReferenceMap(initResult.referenceIds);
	const initRender = () => deserialize(initResult.data, initReferenceMap);

	const Root = defineComponent(() => {
		const render = shallowRef(initRender);
		const isLoading = shallowRef(false);
		provide("isLoading", readonly(isLoading));

		const navManager = new AsyncTaskManager<() => void>({
			onSucess: (result) => {
				render.value = result;
				isLoading.value = false;
			},
		});

		listenBrowserHistory(() => {
			isLoading.value = true;
			navManager.push(async () => {
				const url = new URL(window.location.href);
				url.searchParams.set("__serialize", "");
				const res = await fetch(url);
				tinyassert(res.ok);
				const result: SerializeResult = await res.json();
				const referenceMap = await createReferenceMap(result.referenceIds);
				return () => deserialize(result.data, referenceMap);
			});
		});

		return () => render.value() as any;
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

// interruptible navigation
class AsyncTaskManager<T> {
	private latest?: () => Promise<T>;

	constructor(
		private options: {
			onSucess: (v: T) => void;
		},
	) {}

	push(task: () => Promise<T>) {
		this.latest = task;
		task().then((v) => {
			if (this.latest === task) {
				this.latest = undefined;
				this.options.onSucess(v);
			}
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
