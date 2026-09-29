import { NextResponse } from "next/server";
import { cityClimate, searchCities } from "@/lib/data/locations";

/** GET /api/locations?q=bandung&limit=10 — cari kota dalam dataset. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 60);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 12));
  const items = searchCities(q, limit).map((c) => ({
    id: c.id,
    name: c.name,
    province: c.province,
    lat: c.lat,
    lon: c.lon,
    utcOffset: c.tz,
    ghiAnnual: c.ghi,
    ghiMonthly: cityClimate(c).ghi,
  }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
