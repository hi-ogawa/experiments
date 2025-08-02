import { createFileRoute } from "@tanstack/react-router";
import { tsrRscRoute } from "tsr-rsc:client";

export const Route = createFileRoute("/posts")(tsrRscRoute());
