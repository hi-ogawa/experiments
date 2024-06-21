import { tinyassert } from "@hiogawa/utils";

export default function Page() {
	return (
		<div>
			<h3>Inline Server Action</h3>
			<ServerCounterInline />
		</div>
	);
}

let countInline = 0;

function ServerCounterInline() {
	return (
		<form
			action={(formData: FormData) => {
				"use server";
				const change = Number(formData.get("change"));
				tinyassert(Number.isSafeInteger(change));
				countInline += change;
			}}
		>
			<div style={{ marginBottom: "0.5rem" }}>Count is {countInline}</div>
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
