"use client";

import { changeCount } from "./_action";

export function ServerCounter(props: { value: number }) {
	return (
		<form action={changeCount}>
			<div style={{ marginBottom: "0.5rem" }}>Count is {props.value}</div>
			<div style={{ display: "flex", placeContent: "center", gap: "0.5rem" }}>
				<button name="change" value="-1">
					-1
				</button>
				<button name="change" value="+1">
					+1
				</button>
			</div>
		</form>
	);
}
