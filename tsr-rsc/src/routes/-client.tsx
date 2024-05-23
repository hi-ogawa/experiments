"use client";

import React from "react";

export function Hydrated() {
	const hydrated = React.useSyncExternalStore(
		React.useCallback(() => () => {}, []),
		() => true,
		() => false,
	);
	return <>[hydrated: {Number(hydrated)}]</>;
}

export function Counter() {
	const [count, setCount] = React.useState(0);

	return (
		<div>
			<div>Count: {count}</div>
			<button className="border px-2" onClick={() => setCount((v) => v - 1)}>
				-1
			</button>
			<button className="border px-2" onClick={() => setCount((v) => v + 1)}>
				+1
			</button>
		</div>
	);
}
