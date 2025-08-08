import { createRouter as createReactRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import React from "react";

export function createRouter() {
  return createReactRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    // Tanstack router's deafult pending makes rendering flahses,
    // so make transition always suspend until they are resolved.
    defaultPendingComponent: () => {
      // However, suspending forever can break SSR error handling,
      // so it uses a timeout to bail out.
      if (import.meta.env.SSR) {
        return sleep(3000);
      }

      React.use(pendingPromise);
      return null;
    },
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pendingPromise = new Promise(() => {});

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
