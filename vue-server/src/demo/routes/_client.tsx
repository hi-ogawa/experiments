import { defineComponent, ref } from "vue";
import { registerClientReference } from "../../serialize";

export const ClientCounter = defineComponent(() => {
	const count = ref(0);

	return () => (
		<div data-testid="client-component">
			<h4>Client Component</h4>
			<div>Count: {count.value}</div>
			<button class="client-btn" onClick={() => count.value--}>
				-1
			</button>
			<button class="client-btn" onClick={() => count.value++}>
				+1
			</button>
		</div>
	);
});

registerClientReference(ClientCounter, "ClientCounter");
