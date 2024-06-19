import React from "react";
import reactLogo from "../assets/react.svg?inline";
import webpackLogo from "../assets/webpack.svg?inline";
import { Counter, Hydrated } from "./_client";
import { Client2 } from "./_client2";

export default function Page() {
	return (
		<div>
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
			<pre>
				<Hydrated />
				<Client2 />
			</pre>
			<div className="card">
				<Counter />
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
