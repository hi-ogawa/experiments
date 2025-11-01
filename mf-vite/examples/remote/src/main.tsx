import ReactDOMClient from "react-dom/client";
import { App } from "./app";

function main() {
	const el = document.getElementById("app")!;
	ReactDOMClient.createRoot(el).render(<App />);
}

main();
