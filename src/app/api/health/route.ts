import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ENGINE_VERSION } from "@/lib/engine/constants";

export const dynamic = "force-dynamic";

/** GET /api/health — status layanan & database. */
export async function GET() {
  let db: "ok" | "error" = "ok";
  try {
    const conn = await getDb();
    await conn.run(sql`select 1`);
  } catch {
    db = "error";
  }
  return NextResponse.json({ status: "ok", db, engineVersion: ENGINE_VERSION, time: new Date().toISOString() });
}
