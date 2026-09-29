import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { getIrradiance } from "@/lib/server/irradiance";

export const dynamic = "force-dynamic";

/** GET /api/irradiance?lat=-6.2&lon=106.8 — radiasi (GHI) & suhu bulanan. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!url.searchParams.has("lat") || !url.searchParams.has("lon") || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return jsonError(400, "VALIDATION_ERROR", "Parameter lat & lon wajib berupa angka.");
  }
  if (lat < -11.5 || lat > 6.5 || lon < 94.5 || lon > 141.5) {
    return jsonError(400, "OUT_OF_RANGE", "Koordinat berada di luar wilayah Indonesia.");
  }
  const data = await getIrradiance(lat, lon);
  return NextResponse.json(data, {
    headers: { "Cache-Control": data.source === "nasa-power" ? "public, max-age=86400" : "no-store" },
  });
}
