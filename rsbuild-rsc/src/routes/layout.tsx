import type React from "react";

export default function Layout(props: React.PropsWithChildren) {
	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				<title>Rsbuild RSC</title>
				<link
					rel="icon"
					href="https://assets.rspack.dev/rsbuild/favicon-128x128.png"
				/>
			</head>
			<body>{props.children}</body>
		</html>
	);
}
