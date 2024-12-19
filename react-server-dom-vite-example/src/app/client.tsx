"use client";

import React from "react";

export function Counter() {
	const [count, setCount] = React.useState(0);
	return (
		<div data-testid="client-counter" style={{ padding: "0.5rem" }}>
			<div>Client counter: {count}</div>
			<div>
				<button onClick={() => setCount((c) => c - 1)}>-</button>
				<button onClick={() => setCount((c) => c + 1)}>+</button>
			</div>
		</div>
	);
}

export function Hydrated() {
	return <pre>[hydrated: {Number(useHydrated())}]</pre>;
}

function useHydrated() {
	return React.useSyncExternalStore(
		React.useCallback(() => () => {}, []),
		() => true,
		() => false,
	);
}
