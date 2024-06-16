import React from "react";

export default function Page() {
	return (
		<div>
			<h1>Stream</h1>
			<div></div>
			<React.Suspense fallback={<div>Sleeping 1 sec...</div>}>
				<Sleep />
			</React.Suspense>
		</div>
	);
}

async function Sleep() {
	await new Promise((r) => setTimeout(r, 1000));
	return (
		<div>
			<pre>[rendered at {new Date().toISOString()}]</pre>
		</div>
	);
}
