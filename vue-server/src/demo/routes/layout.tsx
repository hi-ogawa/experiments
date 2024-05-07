import { defineComponent } from "vue";
import { GlobalProgress, Link } from "./_client";

export default defineComponent(async (_props, { slots }) => {
	return () => (
		<div style={{ padding: "1rem 0" }}>
			<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
				<h4 style={{ margin: "0" }}>Hello Server Component</h4>
				<GlobalProgress />
			</div>
			<ul>
				<li>
					<Link href="/">{() => "Home"}</Link>
				</li>
				<li>
					<Link href="/highlight">{() => "highlight.js"}</Link>
				</li>
				<li>
					<Link href="/not-found">{() => "Not found"}</Link>
				</li>
				<li>
					<Link href="/slow">{() => "Slow"}</Link>
				</li>
			</ul>
			<div style={{ marginBottom: "0.5rem" }}>
				<input placeholder="test-input" />
			</div>
			{slots.default?.()}
		</div>
	);
});
