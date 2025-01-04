import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Database } from "../Database";
import { Hono } from "hono";
import { nanoid } from "nanoid";

export const auth = new Hono();

auth.get("/", (c) => c.json({ status: "auth alive" }));

auth.post("/login", async (c) => {
    const { email, password } = await c.req.json();

    if (!email || !password) {
        return c.json({ error: "Email and password are required" }, 400);
    }

    const query = `SELECT * FROM users WHERE email = ? AND password = ?`;
    const res = await Database.query(query, [email, password]);

    if (!res) {
        return c.json({ error: "Invalid credentials" }, 401);
    }

    const sessionId = nanoid();
    setCookie(
        c,
        "SessionID",
        sessionId,
        {
            path: "/",
            secure: true,
            httpOnly: true,
            maxAge: 34560000,
            sameSite: "none",
        },
    );

    // save the user_id in the session
    const updateQuery = `UPDATE users SET SessionID = ? WHERE email = ?`;
    await Database.query(updateQuery, [sessionId, email]);
    delete res.SessionID;
    delete res.ID;
    delete res.Password;
    return c.json(res);
});

auth.post("/register", async (c) => {
    const { email, password, username } = await c.req.json();

    if (!email || !password || !username) {
        return c.json(
            { error: "Email and password and username are required" },
            400,
        );
    }

    try {
        const query =
            `INSERT INTO users (email, password,username,solde) VALUES (?, ?, ?, ?)`;
        await Database.db.run(query, [email, password, username, 0]);

        const sessionId = nanoid();
        setCookie(
            c,
            "SessionID",
            sessionId,
            {
                path: "/",
                secure: true,
                httpOnly: true,
                maxAge: 34560000,
                sameSite: "none",
            },
        );
        const updateQuery = `UPDATE users SET SessionID = ? WHERE email = ?`;
        await Database.query(updateQuery, [sessionId, email]);

        return c.json({ status: "User created" });
    } catch (e) {
        return c.json({ error: e }, 401);
    }
});

auth.get("/logout", async (c) => {
    const sessionId = getCookie(c, "SessionID");
    if (!sessionId) {
        return c.json({ error: "Not logged in" }, 401);
    }
    const query = `UPDATE users SET SessionID = NULL WHERE SessionID = ?`;
    await Database.query(query, [sessionId]);

    deleteCookie(c, "SessionID", {
        path: "/",
        secure: true,
    });
    return c.json({ status: "Logged out" });
});

auth.get("/me", async (c) => {
    // Get the session ID from cookies

    const sessionId = getCookie(c, "SessionID");
    console.log(sessionId);
    if (!sessionId) {
        return c.json({ error: "Not logged in" }, 401); // No session found
    }

    try {
        // Query the database for the session
        const query = `SELECT * FROM users WHERE SessionID = ?`;
        const user = await Database.query(query, [sessionId]);

        if (!user) {
            return c.json({ error: "Invalid session" }, 401); // Invalid session
        }

        // Return the user details (you can sanitize the user data if needed)
        delete user.SessionID;
        delete user.ID;
        delete user.Password;

        return c.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return c.json({ error: "Internal server error" }, 500); // Handle any internal error
    }
});

export default auth;
