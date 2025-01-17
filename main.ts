import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./Apps/Auth";
import { users } from "./Apps/User";
import { houses } from "./Apps/House";
import { Pay } from "./Apps/Pay";
import { data } from "./Apps/Data";

const app = new Hono();

app.use("*", logger()); // Add logger middleware
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*", // Dynamically allow the origin
    credentials: true, // Allow credentials
  }),
);

app.route("/auth", auth);
app.route("/user", users);
app.route("/house", houses);
app.route("/pay", Pay);
app.route("/data", data);
app.get("/", (c) => c.json({ status: "alive" }));

const isProd = process.env.NODE_ENV === "production";

Bun.serve({
  port: 3000 + (isProd ? 0 : 1),
  fetch: app.fetch,
});
