import { useLoaderData } from "@tanstack/react-router";
import { __fetchRsc, __useRsc } from "virtual:client-internal";

export function tsrRscRoute() {
  return {
    loader: __fetchRsc as any,
    component: tsrRscComponent,
  };
}

function tsrRscComponent() {
  const result = useLoaderData({ strict: false });
  const root = __useRsc(result);
  return root;
}
