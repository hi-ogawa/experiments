import React from "react";

export function App() {
	return <Layout />;
}

export function Layout() {
	return (
		<div style={{ border: "1px solid #00000030", padding: "1rem" }}>
			<h1>Static Layout</h1>
			<pre>[rendered at {new Date().toISOString()}]</pre>
			<div style={{ border: "1px solid #00000030", padding: "1rem" }}>
				<React.Suspense fallback={<div>Loading...</div>}>
					<Page />
				</React.Suspense>
			</div>
		</div>
	);
}

export function Page() {
	return (
		<div>
			<h2>Dynamic Page</h2>
			<pre>[rendered at {new Date().toISOString()}]</pre>
		</div>
	);
}
