export function setupBrowserRouter(onNavigation: () => void) {
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

	function linkHandler(e: MouseEvent) {
		const el = e.target;
		if (
			e.button === 0 &&
			!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
			el instanceof HTMLAnchorElement &&
			(!el.target || el.target === "_self") &&
			new URL(el.href).origin === window.location.origin
		) {
			e.preventDefault();
			window.history.pushState({}, "", el.href);
		}
	}
	document.addEventListener("click", linkHandler);

	return () => {
		document.removeEventListener("click", linkHandler);
		window.removeEventListener("pushstate", onNavigation);
		window.removeEventListener("popstate", onNavigation);
		window.history.pushState = oldPushState;
		window.history.replaceState = oldReplaceState;
	};
}
