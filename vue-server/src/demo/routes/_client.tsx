import { defineComponent, inject, ref } from "vue";
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

export const Link = defineComponent<{ href: string }>(
	(props, { slots }) => {
		return () => (
			<a
				href={props.href}
				onClick={(e) => {
					if (
						e.currentTarget instanceof HTMLAnchorElement &&
						e.button === 0 &&
						!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
						(!e.currentTarget.target || e.currentTarget.target === "_self")
					) {
						e.preventDefault();
						history.pushState(null, "", e.currentTarget.href);
					}
				}}
			>
				{slots.default?.()}
			</a>
		);
	},
	{
		props: ["href"],
	},
);

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

// TODO: transform
registerClientReference(ClientCounter, "ClientCounter");
registerClientReference(ClientNested, "ClientNested");
registerClientReference(ClientSfc, "ClientSfc");
registerClientReference(Link, "Link");
registerClientReference(GlobalProgress, "GlobalProgress");

export { ClientSfc };
