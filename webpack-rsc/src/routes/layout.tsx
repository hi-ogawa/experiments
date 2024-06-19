import type React from "react";
import css from "../index.css?raw";

export default function Layout(props: React.PropsWithChildren) {
	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				<title>Webpack RSC</title>
				<link rel="icon" type="image/x-icon" href="/favicon.ico" />
				<style>{css}</style>
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
					<a href="/stream">Stream</a>
				</div>
				<div id="root" style={{ display: "flex", placeContent: "center" }}>
					{props.children}
				</div>
			</body>
		</html>
	);
}
