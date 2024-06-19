import type React from "react";
import { TestHydrated } from "./_client";
import css from "./_style.css?raw";

export default function Layout(props: React.PropsWithChildren) {
	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				<title>Webpack RSC</title>
				<link rel="icon" type="image/x-icon" href="/favicon.ico" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<style>{css}</style>
				<TestHydrated />
			</head>
			<body>
				<div
					style={{
						display: "flex",
						gap: "1rem",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					Menu:
					<a href="/">Home</a>
					<a href="/action">Action</a>
					<a href="/stream">Stream</a>
					<a href="/error">Error</a>
				</div>
				<div id="root" style={{ display: "flex", placeContent: "center" }}>
					{props.children}
				</div>
			</body>
		</html>
	);
}
