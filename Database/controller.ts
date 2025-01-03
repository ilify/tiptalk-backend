import { Database as SQLiteDatabase, open } from "sqlite";
import sqlite3 from "sqlite3";

interface Table {
    name: string;
}

export class Database {
    private static instance: Database;
    public db!: SQLiteDatabase;
    private Tables: string[] = [];

    private constructor() {} // Private constructor for singleton pattern

    static async init(): Promise<Database> {
        if (!this.instance) {
            const instance = new Database();
            const filename = "Database/Data.db"; // Use a constant for the filename
            instance.db = await open({ filename, driver: sqlite3.Database });
            await instance.initTables();
            this.instance = instance;
        }
        return this.instance;
    }

    private async initTables(): Promise<void> {
        const tables = await this.queryAll(
            "SELECT name FROM sqlite_master WHERE type='table';",
        );
        this.Tables = tables
            .map((table: Table) => table.name)
            .filter((table) => table !== "sqlite_sequence");
    }

    async query(query: string, params?: any[]): Promise<any> {
        return this.db.get(query, params);
    }

    async queryAll(query: string, params?: any[]): Promise<any[]> {
        return this.db.all(query, params);
    }

    async insert(query: string, params?: any[]): Promise<void> {
        await this.db.run(query, params);
    }

    async update(query: string, params?: any[]): Promise<void> {
        await this.db.run(query, params);
    }

    async delete(query: string, params?: any[]): Promise<void> {
        await this.db.run(query, params);
    }

    async close(): Promise<void> {
        await this.db.close();
    }
}
