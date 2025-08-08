import type { LoaderFnContext } from "@tanstack/router-core";
import type { RscPayload, RscRequestMeta } from "../entry.rsc";
import type { RscLoaderReturn } from "./shared";
import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import React from "react";

export async function __fetchRsc(
  ctx: LoaderFnContext,
): Promise<RscLoaderReturn> {
  const url = new URL("/__rsc", "http://test.local");
  const meta: RscRequestMeta = {
    routeId: ctx.route.id,
    params: ctx.params,
  };
  url.searchParams.set("meta", JSON.stringify(meta));
  const rscEntry = await import.meta.viteRsc.loadModule<
    typeof import("../entry.rsc")
  >("rsc", "index");
  const res = await rscEntry.handleRscRequest(new Request(url));
  const stream = res!.body!;

  // one stream is injected to html for CSR handoff.
  // another stream is used for SSR via `useRscStream` below.
  const [stream1, stream2] = stream.tee();
  const result = { stream: stream1 };
  payloadMap.set(result, createFromReadableStream<RscPayload>(stream2));
  return result;
}

const payloadMap = new WeakMap<RscLoaderReturn, Promise<RscPayload>>();

export function __useRsc(result: RscLoaderReturn) {
  let payloadPromise = payloadMap.get(result)!;
  const payload = React.use(payloadPromise);
  return payload.root;
}
