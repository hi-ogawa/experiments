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
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
