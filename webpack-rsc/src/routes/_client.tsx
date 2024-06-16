"use client";

import React from "react";

export function Hydrated() {
	if (1) return <>[hydrated: 0]</>;

	return <>[hydrated: {useHydrated()}]</>;
}

export function Counter() {
	if (1) return <button>count is ???</button>;

	const [count, setCount] = React.useState(0);

	return (
		<button onClick={() => setCount((count) => count + 1)}>
			count is {count}
		</button>
	);
}

function useHydrated() {
	return React.useSyncExternalStore(
		React.useCallback(() => () => {}, []),
		() => true,
		() => false,
	);
}
