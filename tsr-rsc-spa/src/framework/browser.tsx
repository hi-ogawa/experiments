import * as ReactClient from "@vitejs/plugin-rsc/browser";
import { RscPayload } from "./entry.rsc";

export async function fetchRsc() {
  const payload = await ReactClient.createFromFetch<RscPayload>(
    fetch(window.location.href),
  );
  return payload.root;
}
