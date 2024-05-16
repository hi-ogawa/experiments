"use client";

import { tinyassert } from "@hiogawa/utils";
import { defineComponent } from "vue";

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

export const Form = defineComponent<{ replace?: boolean }>(
	(props, { slots }) => {
		return () => (
			<form
				onSubmit={(e) => {
					e.preventDefault();
					tinyassert(e.currentTarget instanceof HTMLFormElement);
					const url = new URL(e.currentTarget.action);
					const data = new FormData(e.currentTarget);
					data.forEach((v, k) => {
						if (typeof v === "string") {
							url.searchParams.set(k, v);
						}
					});
					if (props.replace) {
						history.replaceState({}, "", url);
					} else {
						history.pushState({}, "", url);
					}
				}}
			>
				{slots.default?.()}
			</form>
		);
	},
	{
		props: ["replace"],
	},
);
