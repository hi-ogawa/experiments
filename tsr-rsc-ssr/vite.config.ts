/// <reference types="vite/client" />
/// <reference types="@vitejs/plugin-rsc/types" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { tanstackRouterGenerator } from '@tanstack/router-plugin/vite'

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
    env.command === 'serve' && tanstackRouterGenerator(),
  ],
}));
