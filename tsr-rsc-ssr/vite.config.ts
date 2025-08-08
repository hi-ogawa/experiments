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
    env.command === "serve" && tanstackRouterGenerator(),
    {
      name: "fork-tsr-client",
      async resolveId(source, importer, options) {
        if (source === "tsr-rsc:client") {
          if (this.environment.name === "client") {
            return this.resolve("/src/framework/client.browser.tsx");
          }
          if (this.environment.name === "ssr") {
            return this.resolve("/src/framework/client.ssr.tsx");
          }
          throw new Error(
            "tsr-rsc:client can only be used in client or ssr environment",
          );
        }
      },
    },
  ],
  environments: {
    ssr: {
      optimizeDeps: {
        include: ["react-dom/server"],
      },
    },
  },
}));
