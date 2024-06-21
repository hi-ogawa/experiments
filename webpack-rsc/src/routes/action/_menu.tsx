export function Menu() {
	return (
		<div
			style={{
				display: "flex",
				gap: "1rem",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<a href="/action">Basic</a>
			<a href="/action/inline">Inline</a>
		</div>
	);
}
