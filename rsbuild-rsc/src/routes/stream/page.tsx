import React from "react";
import { Client3 } from "./_client3";

export default function Page() {
	return (
		<div
			style={{
				border: "1px solid #0004",
				padding: "1rem",
			}}
		>
			<h2>Stream</h2>
			<Client3 />
			<div
				style={{
					padding: "1rem",
				}}
			>
				<div>Outer</div>
				<pre>[rendered at {new Date().toISOString()}]</pre>
			</div>
			<div
				style={{
					padding: "1rem",
					height: "5rem",
					background: "#f002",
					display: "grid",
					placeContent: "center",
				}}
			>
				<React.Suspense fallback={<div>Sleeping 1 sec...</div>}>
					<Sleep />
				</React.Suspense>
			</div>
		</div>
	);
}

async function Sleep() {
	await new Promise((r) => setTimeout(r, 1000));
	return (
		<div>
			<div>Inner</div>
			<pre>[rendered at {new Date().toISOString()}]</pre>
		</div>
	);
}
