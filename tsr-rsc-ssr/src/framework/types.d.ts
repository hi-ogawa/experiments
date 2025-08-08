declare module "react-dom/server.edge" {
  export * from "react-dom/server";
}

declare module "virtual:client-internal" {
  export const __fetchRsc: import("./client-internal/browser")["__fetchRsc"];
  export const __useRsc: import("./client-internal/browser")["__useRsc"];
}
