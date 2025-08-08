import { createFileRoute } from "@tanstack/react-router";
import { tsrRscRoute } from "../../framework/client";

export const Route = createFileRoute("/posts")(tsrRscRoute());
