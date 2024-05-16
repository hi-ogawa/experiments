"use client";

import { defineComponent, inject, onMounted, ref } from "vue";

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

export const GlobalProgress = defineComponent(() => {
	const isLoading = inject("isLoading", { value: false });
	return () => (
		<span
			style={{
				transition: "opacity 300ms",
				opacity: isLoading.value ? "0.8" : "0",
			}}
		>
			(Loading...)
		</span>
	);
});

export const Hydrated = defineComponent(() => {
	const mounted = ref(0);
	onMounted(() => {
		mounted.value++;
	});
	return () => <span>{`[mounted: ${mounted.value}]`}</span>;
});

export default function ClientDefault() {
	return <span>Client default export</span>;
}
