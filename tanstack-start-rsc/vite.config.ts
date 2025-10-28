import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      srcDirectory: "src",
    }),
    viteReact(),
    // Move rsc plugin after tanstack to let tanstack handle "use server"
    rsc({
      serverHandler: false,
      entries: {
        rsc: "./lib/runtime/rsc.tsx",
      },
    }),
    {
      name: "tanstack:rsc",
      configResolved(config) {
        // TODO: patch buildApp?
        config.plugins;
      },
    },
    import("vite-plugin-inspect").then((m) => m.default()),
  ],
});
