// cf.
// https://github.com/TanStack/router/blob/f6e9ab3b60ca42401923648649930db4ae97fc00/packages/history/src/index.ts#L301-L314

export function listenBrowserHistory(onNavigation: () => void) {
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
