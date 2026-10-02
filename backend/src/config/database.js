import "dotenv/config";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const configuredPath = process.env.SQLITE_DB_PATH || "./data/rentora.sqlite";
const databasePath = configuredPath === ":memory:"
  ? configuredPath
  : path.resolve(process.cwd(), configuredPath);

let database;

export const getDatabase = () => {
  if (!database) {
    if (databasePath !== ":memory:") {
      fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    }
    database = new Database(databasePath);
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    database.function("regexp", (expression, value) => {
      if (value === null || value === undefined) return 0;
      try {
        const { pattern, flags } = JSON.parse(expression);
        return new RegExp(pattern, flags).test(String(value)) ? 1 : 0;
      } catch {
        return 0;
      }
    });
  }
  return database;
};

export const closeDatabase = () => {
  if (database?.open) database.close();
  database = undefined;
};

export { databasePath };
