import { defineComponent } from "vue";
import ClientDefault, { ClientCounter, ClientNested } from "./_client";
import ClientSfc from "./_client-sfc.vue";

export default defineComponent(async () => {
	return () => (
		<div>
			<pre>{`Rendered at ${new Date()}`}</pre>
			<pre>{`typeof window = ${typeof window}`}</pre>
			<h4>Client Component</h4>
			<ClientCounter />
			<ClientSfc />
			<div style={{ margin: "0.5rem 0" }}>
				<ClientDefault />
			</div>
			<h4>Nested Server/Client</h4>
			<ServerNested>
				{() => (
					<ClientNested>
						{() => (
							<ServerNested>
								{() => <ClientNested>{() => <span>server</span>}</ClientNested>}
							</ServerNested>
						)}
					</ClientNested>
				)}
			</ServerNested>
		</div>
	);
});

const ServerNested = defineComponent(async (_props, { slots }) => {
	return () => <span>[server : {slots.default?.()}]</span>;
});
