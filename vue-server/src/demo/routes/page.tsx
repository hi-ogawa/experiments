import { defineComponent } from "vue";
import { ClientCounter } from "./_client";

export default defineComponent(async () => {
	return () => (
		<div>
			<h4>Vue Server Component</h4>
			<div>Server Time: {new Date().toString()}</div>
			<ClientCounter />
		</div>
	);
});
