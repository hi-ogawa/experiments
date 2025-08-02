import { createRouter as createReactRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import React from "react";

export function createRouter() {
  return createReactRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    // by default let loader suspend to avoid flashing fallback.
    // TODO: however, this breaks SSR error handling.
    defaultPendingComponent: () => {
      // if (import.meta.env.SSR) return null;

      React.use(pendingPromise);
      return null;
    },
  });
}

const pendingPromise = new Promise(() => {});

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
