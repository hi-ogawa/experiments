/// <reference types="vite/client" />
/// <reference types="@vitejs/plugin-rsc/types" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { tanstackRouterGenerator } from "@tanstack/router-plugin/vite";

export default defineConfig((env) => ({
  plugins: [
    react(),
    rsc({
      entries: {
        client: "./src/framework/entry.browser.tsx",
        ssr: "./src/framework/entry.ssr.tsx",
        rsc: "./src/framework/entry.rsc.tsx",
      },
    }),
    !env.isPreview &&
      tanstackRouterGenerator({
        routeFileIgnorePattern: "\\.rsc\\.",
      }),
    {
      name: "client-internal",
      async resolveId(source, importer, options) {
        if (source === "virtual:client-internal") {
          if (this.environment.name === "client") {
            return this.resolve("/src/framework/client-internal/browser");
          }
          if (this.environment.name === "ssr") {
            return this.resolve("/src/framework/client-internal/ssr");
          }
          throw new Error(
            `'${source}' can only be used in client or ssr environment`,
          );
        }
      },
    },
  ],
}));
