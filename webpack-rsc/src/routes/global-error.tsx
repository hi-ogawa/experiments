"use client";

export default function GlobalErrorPage() {
	return (
		<html>
			<body
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<h3>Something went wrong</h3>
				<div>
					Back to <a href="/">Home</a>
				</div>
			</body>
		</html>
	);
}
