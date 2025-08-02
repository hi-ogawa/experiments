import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../router";

function main() {
  const rootElement = document.getElementById("app")!;
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}

main();
