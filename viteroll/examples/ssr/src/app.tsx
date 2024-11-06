import React from "react";

export function App() {
	const [count, setCount] = React.useState(0);
	return (
		<div>
			<h1>Rolldown SSR</h1>
			<button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
		</div>
	);
}
