"use client";

import React from "react";
import { changeCount } from "./_action";

export function ServerCounter(props: { value: number }) {
	const [state, formAction, isPending] = React.useActionState(
		changeCount,
		null,
	);

	return (
		<form action={formAction}>
			<div style={{ marginBottom: "0.5rem" }}>Count is {props.value}</div>
			<div style={{ display: "flex", placeContent: "center", gap: "0.5rem" }}>
				<button name="change" value="-1">
					-1
				</button>
				<button name="change" value="+1">
					+1
				</button>
			</div>
			<pre>
				{`isPending = ${String(isPending).padEnd(5, " ")}`}
				<br />
				state = {JSON.stringify(state)}
			</pre>
		</form>
	);
}
