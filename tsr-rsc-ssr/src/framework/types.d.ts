declare module "react-dom/server.edge" {
  export * from "react-dom/server";
}

declare module "tsr-rsc:client" {
  export function tsrRscRoute(): any;
}
