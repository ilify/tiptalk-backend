import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./Apps/Auth";
import { users } from "./Apps/User";
import { houses } from "./Apps/House";
import { Pay } from "./Apps/Pay";

const app = new Hono();

app.use("*", logger()); // Add logger middleware
app.use(
    "*",
    cors({
        origin: "*", // Allow requests from any origin
        credentials: true, // Include credentials if needed
    }),
);

app.route("/auth", auth);
app.route("/user", users);
app.route("/house", houses);
app.route("/pay", Pay);
app.get("/", (c) => c.json({ status: "alive" }));

Bun.serve({
    port: 3000,
    fetch: app.fetch,
});
