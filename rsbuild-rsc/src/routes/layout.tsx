import type React from "react";

export default function Layout(props: React.PropsWithChildren) {
	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				<title>Rsbuild RSC</title>
			</head>
			<body>{props.children}</body>
		</html>
	);
}
