import { Hono } from "hono";
import { Database } from "../Database";

export const data = new Hono();

data.get("/", (c) => c.json({ status: "data alive" }));

data.get("/db", async (c) => {
    const db = {
        users: [],
        houses: [],
        transactions: [],
    };
    const query = `SELECT * FROM users;`;
    // @ts-ignore
    db.users = await Database.queryAll(query);
    const query2 = `SELECT * FROM houses;`;
    // @ts-ignore
    db.houses = await Database.queryAll(query2);
    const query3 = `SELECT * FROM transactions;`;
    // @ts-ignore
    db.transactions = await Database.queryAll(query3);
    return c.json(db);
});
