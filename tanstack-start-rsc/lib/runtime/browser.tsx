import { createFromReadableStream } from "@vitejs/plugin-rsc/browser";
import type { SerInput, SerOutput } from "./ssr";
import { arrayToStream } from "./utils";

export async function __serialize(_data: SerInput) {
  throw new Error("cannot serialize on browser");
}

export async function __deserialize(serialized: SerOutput) {
  const array = await serialized;
  const deserialized = await createFromReadableStream<SerInput>(
    arrayToStream(array),
  );
  return deserialized;
}
