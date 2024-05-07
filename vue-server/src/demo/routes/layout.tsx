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
			</ul>
			<input placeholder="test-input" />
			{slots.default?.()}
		</div>
	);
});
