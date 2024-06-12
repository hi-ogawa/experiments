import React from "react";
import css from "./index.css?raw";
import { usePromise } from "./context";

export function App() {
	return (
		<html>
			<head>
				<meta charSet="UTF-8" />
				<title>React PPR</title>
				<meta
					name="viewport"
					content="width=device-width, height=device-height, initial-scale=1.0"
				/>
				<style>{css}</style>
				{import.meta.env.DEV && (
					<script type="module" src="/@vite/client"></script>
				)}
			</head>
			<body>
				<div id="root">
					<Layout />
				</div>
			</body>
		</html>
	);
}

function Layout() {
	return (
		<div style={{ border: "1px solid #00000030", padding: "1rem" }}>
			<h1>Static Layout</h1>
			<pre>[rendered at {new Date().toISOString()}]</pre>
			<div
				style={{
					border: "1px solid #00000030",
					padding: "1rem",
					height: "8rem",
					width: "20rem",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<React.Suspense fallback={<div>Loading...</div>}>
					<Page />
				</React.Suspense>
			</div>
		</div>
	);
}

function Page() {
	usePromise(() => new Promise((r) => setTimeout(r, 1000)));

	return (
		<div>
			<h2>Dynamic Page</h2>
			<pre>[rendered at {new Date().toISOString()}]</pre>
		</div>
	);
}
