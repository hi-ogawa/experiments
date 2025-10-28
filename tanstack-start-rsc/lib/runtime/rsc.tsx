import React from "react";
import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc";
import { concatArrayStream } from "./utils";

export async function __render(node: React.ReactNode) {
  const stream = renderToReadableStream(node);
  return concatArrayStream(stream);
}
