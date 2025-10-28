import React from "react";
import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc";

export async function __render(node: React.ReactNode) {
  return renderToReadableStream(node);
}
