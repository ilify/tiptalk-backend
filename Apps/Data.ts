import { Hono } from "hono";
import { Database } from "../Database";
import { users } from "./User";

export const data = new Hono();

data.get("/", (c) => c.json({ status: "data alive" }));

data.get("/db", async (c) => {
    const db = {
        users: null,
        houses: null,
        transactions: null,
    };
    const query = `SELECT * FROM users`;
    db.users = await Database.query(query);
    const query2 = `SELECT * FROM houses`;
    db.houses = await Database.query(query2);
    const query3 = `SELECT * FROM transactions`;
    db.transactions = await Database.query(query3);
    return c.json(db);
});
