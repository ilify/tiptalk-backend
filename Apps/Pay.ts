import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { Database } from "../Database";

export const Pay = new Hono();
const isProd = process.env.NODE_ENV === "production";

async function GetMyIPGlobal() {
    if (isProd) {
        return "https://tiptalk.up.railway.app";
    }
    const ip = await fetch("https://api.ipify.org?format=json").then((res) =>
        res.json()
    )
        .then((data) => data.ip);
    return `http://${ip}:3000`;
}

const AllowedCodes = {
    "00c1": {
        price: 10000,
        solde: 1000,
        currency: "TND",
        description: "Payment for 1 month subscription",
    },
    "00c2": {
        price: 20000,
        solde: 2450,
        currency: "TND",
        description: "Payment for 2 month subscription",
    },
    "00c3": {
        price: 30000,
        solde: 5900,
        currency: "TND",
        description: "Payment for 3 month subscription",
    },
    "000t": {
        price: 9999,
        solde: 9999,
        currency: "TND",
        description: "Test payment (Development only)",
    },
};

Pay.get("/", (c) => c.json({ status: "Pay alive" }));
Pay.get("/Prices", (c) => {
    const res = AllowedCodes;
    // Delete Test code from production
    // @ts-ignore
    delete res["000t"];
    return c.json(res);
});
Pay.get("/link/:code", async (c) => {
    const SessionID = getCookie(c, "SessionID");
    if (!SessionID) {
        return c.json({ error: "Not Authorized" }, 401);
    }
    const user = await Database.query(
        `SELECT * FROM users WHERE SessionID = ?`,
        [SessionID],
    );
    const code = c.req.param("code") as keyof typeof AllowedCodes;
    const ip = await GetMyIPGlobal();

    const response = await fetch(
        "https://api.preprod.konnect.network/api/v2/payments/init-payment",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key":
                    "677597f1d2cfbd306d85afad:7jTON218Wdi78FTFkF0BYPdSJ",
            },
            body: JSON.stringify({
                "receiverWalletId": "677597f1d2cfbd306d85afb5",
                "token": AllowedCodes[code].currency,
                "amount": AllowedCodes[code].price,
                "type": "immediate",
                "description": AllowedCodes[code].description,
                "acceptedPaymentMethods": [
                    "wallet",
                    "bank_card",
                    "e-DINAR",
                ],
                "lifespan": 20,
                "checkoutForm": false,
                "addPaymentFeesToAmount": false,
                "firstName": user.Username,
                "lastName": " - " + code,
                "phoneNumber": user.Phone || "00000000",
                "email": user.Email,
                "webhook": ip + "/pay/checkpay", // Change this to your own webhook
                "silentWebhook": true,
            }),
        },
    );

    const data = await response.json();

    if (!response.ok) {
        return c.json({ error: data }, 500);
    }
    const insertQuery =
        `INSERT INTO Transactions (UserID,PaymentRef,Ammount,Date,Type,Currency,Done) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await Database.query(insertQuery, [
        user.ID,
        data.paymentRef,
        AllowedCodes[code].price,
        new Date().toISOString(),
        code,
        AllowedCodes[code].currency,
        false,
    ]);

    return c.json({ payUrl: data.payUrl, paymentRef: data.paymentRef });
});

Pay.get("/checkpay", async (c) => {
    const paymentRefs = c.req.queries("payment_ref");
    if (!paymentRefs || paymentRefs.length === 0) {
        return c.json({ error: "Payment reference not provided" }, 400);
    }
    const query = paymentRefs[0];
    console.log(query);
    const checkRef = `SELECT * FROM Transactions WHERE PaymentRef = ?`;
    const res = await Database.query(checkRef, [query]) as {
        Type: keyof typeof AllowedCodes;
        UserID: number;
        Done: boolean;
    };
    console.log(res);
    if (!res) {
        return c.json({ error: "Payment not found" }, 404);
    }
    if (res.Done) {
        return c.json({ status: "Payment already received" });
    }
    const UpdateQuery = `UPDATE Transactions SET Done = 1 WHERE PaymentRef = ?`;
    await Database.query(UpdateQuery, [query]);

    const UpdateSoldeQuery = `UPDATE Users SET Solde = Solde + ? WHERE ID = ?`;
    await Database.query(UpdateSoldeQuery, [
        AllowedCodes[res.Type].solde,
        res.UserID,
    ]);

    return c.json({ status: "Payment received" });
});

Pay.get("/isPayed/:ref", async (c) => {
    const SessionID = getCookie(c, "SessionID");
    if (!SessionID) {
        return c.json({ error: "Not Authorized" }, 401);
    }
    const ref = c.req.param("ref");
    const checkRef = `SELECT * FROM Transactions WHERE PaymentRef = ?`;
    const res = await Database.query(checkRef, [ref]);
    if (!res) {
        return c.json({ error: "Payment not found" }, 404);
    }
    return c.json({ status: res.Done });
});
