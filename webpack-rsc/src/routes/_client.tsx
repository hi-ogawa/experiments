"use client";

import React from "react";

export function Hydrated() {
	return <>[hydrated: {Number(useHydrated())}]</>;
}

export const Counter: React.FC = () => {
	const [count, setCount] = React.useState(0);

	return (
		<button onClick={() => setCount((count) => count + 1)}>
			count is {count}
		</button>
	);
};

function useHydrated() {
	return React.useSyncExternalStore(
		React.useCallback(() => () => {}, []),
		() => true,
		() => false,
	);
}

export function TestHydrated() {
	return <meta name="x-hydrated" data-hydrated={useHydrated()} />;
}
