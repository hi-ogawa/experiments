import React from "react";
import reactLogo from "../assets/react.svg?inline";
import webpackLogo from "../assets/webpack.svg?inline";
import css from "../index.css?raw";

export default function Page() {
	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				<title>Webpack RSC</title>
				<link rel="icon" type="image/x-icon" href="/favicon.ico" />
				<style>{css}</style>
			</head>
			<body>
				<App />
			</body>
		</html>
	);
}

function App() {
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
			<h1>Webpack + React</h1>
			<pre>{React.version}</pre>
			{/* <pre>[hydrated: {String(useHydrated())}]</pre> */}
			<div className="card">
				{/* <button onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</button> */}
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on Webpack and React logos to learn more
			</p>
			<React.Suspense fallback={<div>Sleeping 1 sec...</div>}>
				<Sleep />
			</React.Suspense>
		</div>
	);
}

async function Sleep() {
	await new Promise((r) => setTimeout(r, 1000));
	return <div>Hello!</div>;
}

// function useHydrated() {
// 	return React.useSyncExternalStore(
// 		React.useCallback(() => () => {}, []),
// 		() => true,
// 		() => false,
// 	);
// }
