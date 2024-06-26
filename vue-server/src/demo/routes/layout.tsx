import { defineComponent } from "vue";
import { Link } from "../integrations/router/client";
import { GlobalProgress } from "./_client";
import { Hydrated } from "./_client-re-export";

export default defineComponent(async (_props, { slots }) => {
	return () => (
		<div style={{ padding: "1rem 0" }}>
			<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
				<h4 style={{ margin: "0" }}>Vue Server Component</h4>
				<a
					href="https://github.com/hi-ogawa/experiments/tree/main/vue-server"
					target="_blank"
				>
					GitHub
				</a>
				<GlobalProgress />
			</div>
			<ul>
				<li>
					<Link href="/">{() => "Home"}</Link>
				</li>
				<li>
					<Link href="/highlight">{() => "Highlight (Shiki)"}</Link>
				</li>
				<li>
					<Link href="/slow">{() => "Slow"}</Link>
				</li>
				<li>
					<Link href="/sfc">{() => "SFC"}</Link>
				</li>
				<li>
					<Link href="/not-found">{() => "Not found"}</Link>
				</li>
			</ul>
			<div style={{ marginBottom: "0.5rem" }}>
				<input style={{ marginRight: "0.5rem" }} placeholder="(test)" />
				<Hydrated />
			</div>
			{slots.default?.()}
		</div>
	);
});
