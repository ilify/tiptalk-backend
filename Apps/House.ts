import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { Database } from "../Database";

export const houses = new Hono();

houses.get("/", (c) => c.json({ status: "houses alive" }));

houses.post("/post", async (c) => {
    const sessionId = getCookie(c, "SessionID");
    if (!sessionId) {
        return c.json({ error: "Not Authorized" }, 401); // No session found
    }
    const user = await Database.query(
        `SELECT * FROM users WHERE SessionID = ?`,
        [
            sessionId,
        ],
    );
    if (!user) {
        return c.json({ error: "Not Authorized" }, 401); // No user found
    }

    const insertQuery =
        `INSERT INTO houses (Data, Listed, Score, Promoted,Owner,Valable) VALUES (?, ?, ?, ?, ?,?)`;

    const Data = await c.req.json();
    Data.PostDate = new Date().toISOString();
    const DeductQuery = `UPDATE users SET Solde = Solde - ? WHERE ID = ?`;
    await Database.query(DeductQuery, [Data.paymentoption.credit, user.ID]);

    const Valable = Data.paymentoption.days;
    delete Data.paymentoption;
    const Listed = true;
    const Score = 100;
    const Promoted = false;
    const Owner = user.ID;
    try {
        await Database.query(insertQuery, [
            JSON.stringify(Data),
            Listed,
            Score,
            Promoted,
            Owner,
            Valable,
        ]);
    } catch (e) {
        return c.json({ error: "Error in posting house" }, 401);
    }
    // get the house id
    const house = await Database.query(
        `SELECT * FROM houses WHERE Owner = ? ORDER BY ID DESC LIMIT 1`,
        [user.ID],
    );
    const houseID = house.ID;
    return c.json({ status: "House posted", houseID });
});

houses.get("/feed", async (c) => {
    const SearchQuery = "SELECT * FROM houses WHERE Listed = 1";
    const res = await Database.queryAll(SearchQuery);
    const houses = [];
    for (const row of res) {
        row.Data = JSON.parse(row.Data);
        row.Data.images = row.Data.images.slice(0, 1);
        const house = {
            ...row.Data,
            ID: row.ID,
            Score: row.Score,
            Promoted: row.Promoted,
        };
        houses.push(house);
    }
    return c.json(houses);
});

houses.get("/get/:id", async (c) => {
    const SearchQuery = "SELECT * FROM houses WHERE ID = ?";
    const res = await Database.query(SearchQuery, [c.req.param("id")]);
    if (!res) {
        return c.json({ error: "House not found" }, 404);
    }
    const OwnerID = res.Owner;
    const OwnerDetailQuerry = "SELECT * FROM users WHERE ID = ?";
    const Owner = await Database.query(OwnerDetailQuerry, [OwnerID]);

    const house = {
        ...JSON.parse(res.Data),
        ID: res.ID,
        Score: res.Score,
        Promoted: res.Promoted,
        Owner: {
            Username: Owner.Username,
            Email: Owner.Email,
        },
    };
    return c.json(house);
});
