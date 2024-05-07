import { defineComponent } from "vue";

export default defineComponent(async (_props, { slots }) => {
	return () => (
		<div>
			<h4>Hello Server Component</h4>
			<ul>
				<li>
					<a href="/">Home</a>
				</li>
				<li>
					<a href="/shiki">Shiki</a>
				</li>
			</ul>
			{slots.default?.()}
		</div>
	);
});
