import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import type React from "react";
import { arrayToStream } from "./utils";

export type SerInput = React.ReactNode;
export type SerOutput = ReturnType<typeof __serialize>;

export async function __serialize(data: SerInput) {
  const rscRuntime = await loadRscRuntime();
  return rscRuntime.__render(data);
}

export async function __deserialize(serialized: SerOutput) {
  const array = await serialized;
  const deserialized = await createFromReadableStream<SerInput>(
    arrayToStream(array),
  );
  return deserialized;
}

function loadRscRuntime() {
  return import.meta.viteRsc.loadModule<typeof import("./rsc")>("rsc", "index");
}
