import { createFromReadableStream } from "@vitejs/plugin-rsc/browser";
import type { SerInput, SerOutput } from "./ssr";

export async function __serialize(_data: SerInput) {
  throw new Error("cannot serialize on browser");
}

export async function __deserialize(serialized: SerOutput) {
  const deserialized = await createFromReadableStream<SerInput>(
    await serialized,
  );
  return deserialized;
}
