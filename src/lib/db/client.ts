import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

const DEFAULT_URL = "file:./data/suryahitung.db";

let dbPromise: Promise<Database> | null = null;

export function databaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || DEFAULT_URL;
}

async function init(): Promise<Database> {
  const url = databaseUrl();
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    if (filePath && filePath !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const db = drizzle(client, { schema });
  // Migrasi idempoten: aman dijalankan berkali-kali.
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

/** Koneksi database (lazy, dibagi dalam satu proses). */
export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = init().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/** Hanya untuk pengujian: reset koneksi agar DATABASE_URL baru dipakai. */
export function resetDbForTests(): void {
  dbPromise = null;
}

export { schema };
