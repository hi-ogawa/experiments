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
			<a href="/action/extra">Inline</a>
		</div>
	);
}
