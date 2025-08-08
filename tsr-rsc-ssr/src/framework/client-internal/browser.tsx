import type { LoaderFnContext } from "@tanstack/router-core";
import type { RscPayload, RscRequestMeta } from "../entry.rsc";
import type { RscLoaderReturn } from "./shared";
import { createFromReadableStream } from "@vitejs/plugin-rsc/browser";
import React from "react";

export async function __fetchRsc(
  ctx: LoaderFnContext,
): Promise<RscLoaderReturn> {
  const url = new URL("/__rsc", window.location.href);
  const meta: RscRequestMeta = {
    routeId: ctx.route.id,
    params: ctx.params,
  };
  url.searchParams.set("meta", JSON.stringify(meta));
  const res = await fetch(url);
  return { stream: res.body! };
}

const payloadMap = new WeakMap<RscLoaderReturn, Promise<RscPayload>>();

export function __useRsc(result: RscLoaderReturn) {
  let payloadPromise = payloadMap.get(result);
  if (!payloadPromise) {
    payloadPromise = createFromReadableStream<RscPayload>(result.stream);
    payloadMap.set(result, payloadPromise);
  }
  const payload = React.use(payloadPromise);
  return payload.root;
}
