import React from "react";
import reactLogo from "../assets/react.svg?inline";
import webpackLogo from "../assets/webpack.svg?inline";

export default function Page() {
	// const [count, setCount] = React.useState(0);

	return (
		<div id="root">
			<div>
				<a href="https://webpack.js.org" target="_blank">
					<img src={webpackLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://react.dev" target="_blank">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>Webpack RSC</h1>
			<pre>{React.version}</pre>
			{/* <pre>[hydrated: {String(useHydrated())}]</pre> */}
			<div className="card">
				{/* <button onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</button> */}
				<p style={{ display: "none" }}>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on Webpack and React logos to learn more
			</p>
			<p className="read-the-docs">
				<a href="https://github.com/hi-ogawa/experiments/tree/main/webpack-rsc">
					View code on GitHub
				</a>
			</p>
		</div>
	);
}

// function useHydrated() {
// 	return React.useSyncExternalStore(
// 		React.useCallback(() => () => {}, []),
// 		() => true,
// 		() => false,
// 	);
// }
