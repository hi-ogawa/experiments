import { defineComponent } from "vue";
import { ClientCounter, ClientNested, ClientSfc } from "./_client";

export default defineComponent(async () => {
	return () => (
		<div>
			<h4>Vue Server Component</h4>
			<pre>{`rendered at: ${new Date().toString()}`}</pre>
			<h4>Client Component</h4>
			<ClientCounter />
			<ClientSfc />
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
