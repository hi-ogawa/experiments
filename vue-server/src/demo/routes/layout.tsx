import { defineComponent } from "vue";
import { Link } from "./_client";

export default defineComponent(async (_props, { slots }) => {
	return () => (
		<div>
			<h4>Hello Server Component</h4>
			<ul>
				<li>
					<Link href="/">{() => "Home"}</Link>
				</li>
				<li>
					<Link href="/shiki">{() => "Shiki"}</Link>
				</li>
				<li>
					<Link href="/not-found">{() => "Not found"}</Link>
				</li>
			</ul>
			<div style={{ marginBottom: "0.5rem" }}>
				<input placeholder="test-input" />
			</div>
			{slots.default?.()}
		</div>
	);
});
