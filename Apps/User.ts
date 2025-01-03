import { Hono } from "hono";

export const users = new Hono();

users.get("/", (c) => c.json({ status: "users alive" }));
