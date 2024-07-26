import React from "react";
import "./index.css";

export function App() {
	const [count, setCount] = React.useState(0);
	return (
		<div id="root">
			<h1>Rsbuild React SSR</h1>
			<pre>{React.version}</pre>
			<pre>[hydrated: {Number(useHydrated())}]</pre>
			<div className="card">
				<button onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</button>
				{/* TODO: HMR */}
				<p style={{ display: "none" }}>
					Edit <code>src/app.tsx</code> and save to test HMR
				</p>
			</div>
		</div>
	);
}

function useHydrated() {
	return React.useSyncExternalStore(
		React.useCallback(() => () => {}, []),
		() => true,
		() => false,
	);
}
