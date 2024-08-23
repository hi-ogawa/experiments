import * as runtime from "@module-federation/runtime";
import type { RemoteEntryExports } from "@module-federation/runtime/types";

export const init: RemoteEntryExports["init"] = async (shareScope) => {
	const host = runtime.init({
		name: "remote-vite",
		remotes: [],
		shared: {
			react: {
				get: () => import("react").then((lib) => () => lib),
			},
		},
	});
	host.initShareScopeMap("default", shareScope);
};

export const get: RemoteEntryExports["get"] = (_id) => async () => {
	const shared = await runtime.loadShare<typeof import("react")>("react");
	const shared_ = shared && shared();
	if (!shared_) throw new Error("no react from loadShare");

	const React = shared_;

	function App(props: {}) {
		return React.createElement(
			React.Fragment,
			null,
			`\n  props = ${JSON.stringify(props)}`,
			`\n  import.meta.url = ${import.meta.url}`,
		);
	}

	return { App };
};
