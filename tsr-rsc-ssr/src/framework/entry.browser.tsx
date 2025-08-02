import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createRouter } from "../router";

function main() {
  const router = createRouter();
  ReactDOM.hydrateRoot(document, <RouterProvider router={router} />);
}

main();
