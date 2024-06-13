import React from "react";
import css from "./index.css?raw";
import { ssrContextStorage, useCache } from "./context";

export function App() {
	return (
		<html>
			<head>
				<meta charSet="UTF-8" />
				<title>React PPR</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<style>{css}</style>
				{import.meta.env.DEV && (
					<script type="module" src="/@vite/client"></script>
				)}
			</head>
			<body>
				<div id="root">
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
							gap: "0.5rem",
							padding: "0.5rem",
							marginBottom: "1rem",
						}}
					>
						<a className="btn" href="/">
							SSR
						</a>
						<a className="btn" href="/?ppr" aria-disabled={import.meta.env.DEV}>
							PPR
						</a>
						<a className="btn" href="/?prerender">
							Prerender only
						</a>
						<a className="btn" href="/?prerender&resume">
							Prerender + Resume
						</a>
					</div>
					<Layout />
				</div>
			</body>
		</html>
	);
}

function Layout() {
	return (
		<div
			style={{
				border: "1px solid #00000030",
				padding: "1rem",
			}}
		>
			<h2>Static</h2>
			<pre style={{ whiteSpace: "wrap" }}>
				[rendered at {new Date().toISOString()}]
			</pre>
			<div
				style={{
					background: "#00ff0010",
					marginBottom: "1rem",
					height: "8rem",
					width: "100%",
					display: "grid",
					alignContent: "center",
				}}
			>
				<React.Suspense fallback={<div>Sleeping 1 sec ...</div>}>
					<Postpone>
						<Sleep id="1" ms={1000} />
					</Postpone>
				</React.Suspense>
			</div>
			<div
				style={{
					background: "#ff000010",
					height: "8rem",
					width: "100%",
					display: "grid",
					alignContent: "center",
				}}
			>
				<React.Suspense fallback={<div>Sleeping 2 sec ...</div>}>
					<Postpone>
						<Sleep id="2" ms={2000} />
					</Postpone>
				</React.Suspense>
			</div>
		</div>
	);
}

function Sleep(props: { id: string; ms: number }) {
	React.use(
		useCache(
			`sleep-${props.id}`,
			() => new Promise((r) => setTimeout(r, props.ms)),
		),
	);

	return (
		<div>
			<h2>Dynamic {props.id}</h2>
			<pre style={{ whiteSpace: "wrap" }}>
				[rendered at {new Date().toISOString()}]
			</pre>
		</div>
	);
}

function Postpone(props: React.PropsWithChildren) {
	const ctx = ssrContextStorage.getStore()!;
	if (ctx.mode === "prerender") {
		// @ts-expect-error
		React.unstable_postpone();
	}
	return <>{props.children}</>;
}
