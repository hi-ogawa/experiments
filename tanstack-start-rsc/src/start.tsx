import { createStart } from "@tanstack/react-start";
import { createSerializationAdapter } from "@tanstack/react-router";
import React from "react";

export const startInstance = createStart(async () => {
  const reactClientRuntime = await (import.meta.env.SSR
    ? import("../lib/runtime/ssr")
    : import("../lib/runtime/browser"));

  const rscAdapter = createSerializationAdapter({
    key: "rsc",
    test: (value: any) => React.isValidElement(value),
    toSerializable: reactClientRuntime.__serialize as any,
    fromSerializable: reactClientRuntime.__deserialize as any,
  });

  return {
    serializationAdapters: [rscAdapter],
  };
});
