import React from "react";
import { Counter, Hydrated } from "./_client";

export default function Page() {
	return (
		<div id="root">
			<h1>Rsbuild RSC</h1>
			<pre>{React.version}</pre>
			<Hydrated />
			<Counter />
			<p className="read-the-docs">
				<a href="https://github.com/hi-ogawa/experiments/tree/main/rsbuild-rsc">
					View code on GitHub
				</a>
			</p>
		</div>
	);
}
