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
			<body>{props.children}</body>
		</html>
	);
}
