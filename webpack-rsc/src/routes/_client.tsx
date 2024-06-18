"use client";

import React from "react";

export function Hydrated() {
	return <>[hydrated: {Number(useHydrated())}]</>;
}

export function Counter() {
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
