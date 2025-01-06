import { Database } from "bun:sqlite";
import path from "path";
interface Table {
    name: string;
}

export class DatabaseWrapper {
    private static instance: DatabaseWrapper;
    public db!: Database;
    private Tables: string[] = [];

    private constructor() {} // Private constructor for singleton pattern

    static init(): DatabaseWrapper {
        if (!this.instance) {
            const instance = new DatabaseWrapper();
            const isProd = process.env.NODE_ENV === "production";
            const filename = path.join(
                __dirname,
                isProd ? "Prod.db" : "Dev.db",
            ); // Use path.join for cross-platform compatibility
            // console.log("Database path: ", filename);
            instance.db = new Database(filename);
            instance.initTables();
            this.instance = instance;
        }
        this.instance.db.run("PRAGMA journal_mode = WAL;");
        return this.instance;
    }

    private initTables(): void {
        const tables = this.queryAll(
            "SELECT name FROM sqlite_master WHERE type='table';",
        );
        this.Tables = tables
            .map((table: Table) => table.name)
            .filter((table) => table !== "sqlite_sequence");
    }

    query(query: string, params?: any[]): any {
        // @ts-ignore
        return this.db.prepare(query).get(params);
    }

    queryAll(query: string, params?: any[]): any[] {
        // @ts-ignore
        return this.db.prepare(query).all(params);
    }

    insert(query: string, params?: any[]): void {
        // @ts-ignore
        this.db.prepare(query).run(params);
    }

    update(query: string, params?: any[]): void {
        // @ts-ignore
        this.db.prepare(query).run(params);
    }

    delete(query: string, params?: any[]): void {
        // @ts-ignore
        this.db.prepare(query).run(params);
    }

    close(): void {
        this.db.close();
    }
}
