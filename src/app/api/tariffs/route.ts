import { NextResponse } from "next/server";
import { TARIFF_LAST_UPDATED, TARIFF_PERIOD_LABEL, TARIFFS } from "@/lib/data/tariffs";

/** GET /api/tariffs — tabel tarif tenaga listrik PLN yang dipakai kalkulator. */
export async function GET() {
  return NextResponse.json(
    { period: TARIFF_PERIOD_LABEL, lastUpdated: TARIFF_LAST_UPDATED, currency: "IDR", unit: "Rp/kWh", items: TARIFFS },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
