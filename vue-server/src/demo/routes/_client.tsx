import { defineComponent, ref } from "vue";
import { registerClientReference } from "../../serialize";
import ClientSfc from "./_client-sfc.vue";

export const ClientCounter = defineComponent(() => {
	const count = ref(0);

	return () => (
		<div data-testid="client-counter">
			<div>{`Count: ${count.value}`}</div>
			<button class="client-btn" onClick={() => count.value--}>
				-1
			</button>
			<button class="client-btn" onClick={() => count.value++}>
				+1
			</button>
		</div>
	);
});

export const ClientNested = defineComponent((_props, { slots }) => {
	const count = ref(0);
	return () => (
		<span>
			[<button onClick={() => count.value++}>{`client: ${count.value}`}</button>
			: {slots.default?.()}]
		</span>
	);
});

// TODO: transform
registerClientReference(ClientCounter, "ClientCounter");
registerClientReference(ClientNested, "ClientNested");
registerClientReference(ClientSfc, "ClientSfc");
export { ClientSfc };
