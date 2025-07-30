import * as ReactClient from "@vitejs/plugin-rsc/browser";
import { RscPayload } from "./entry.rsc";
import React from "react";

// TODO:
// fork client utilities for browser and ssr.
// this is currently browser only.

// TODO:ergnomic helper?
// - <FetchRsc ... />
// - import { Post } from "./post.server" with { tsr: "rsc" }
// - fs convention

export async function fetchRscStream() {
  const res = await fetch(window.location.href);
  return res.body!;
}

const streamMap = new WeakMap<ReadableStream, Promise<RscPayload>>();

export function useRscStream(stream: ReadableStream) {
  let payloadPromise = streamMap.get(stream);
  if (!payloadPromise) {
    payloadPromise = ReactClient.createFromReadableStream<RscPayload>(stream);
    streamMap.set(stream, payloadPromise);
  }
  // TODO: this flickers because router doesn't use transition and always renders fallback?
  const payload = React.use(payloadPromise);
  return payload.root;
}
