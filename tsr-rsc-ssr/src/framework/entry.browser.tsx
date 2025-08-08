import ReactDOM from "react-dom/client";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { createRouter } from "../router";

function main() {
  const router = createRouter();
  ReactDOM.hydrateRoot(document, <RouterClient router={router} />);
}

main();
