import { Counter, Hydrated } from "./client";

export async function App() {
	return (
		<html>
			<head>
				<meta charSet="UTF-8" />
				<title>react-server</title>
				{import.meta.env.DEV && (
					<>
						<script type="module" src="/@vite/client"></script>
					</>
				)}
				<meta
					name="viewport"
					content="width=device-width, height=device-height, initial-scale=1.0"
				/>
			</head>
			<body>
				<div>
					<div>server random: {Math.random().toString(36).slice(2)}</div>
					<Counter />
					<Hydrated />
				</div>
			</body>
		</html>
	);
}
