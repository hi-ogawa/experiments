"use client";

import React from "react";

export function Counter() {
	const [count, setCount] = React.useState(0);
	return (
		<button onClick={() => setCount((v) => v + 1)}>Count is {count}</button>
	);
}
