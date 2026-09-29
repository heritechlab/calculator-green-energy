import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { getReport } from "@/lib/server/reports";

export const dynamic = "force-dynamic";

/** GET /api/reports/{id} — ambil laporan tersimpan. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const report = await getReport(id);
    if (!report) return jsonError(404, "NOT_FOUND", "Laporan tidak ditemukan.");
    return NextResponse.json(report);
  } catch (error) {
    console.error("[reports] gagal membaca", error);
    return jsonError(503, "STORAGE_UNAVAILABLE", "Penyimpanan sedang tidak tersedia. Coba lagi nanti.");
  }
}
