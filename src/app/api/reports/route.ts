import { NextResponse } from "next/server";
import { resolveInput } from "@/lib/engine";
import { clientIp, jsonError, parseBody } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { createReport } from "@/lib/server/reports";

export const dynamic = "force-dynamic";

/** POST /api/reports — simpan perhitungan: `{ title?, input }` → `{ id, url }`. */
export async function POST(request: Request) {
  const limit = rateLimit(`report:${clientIp(request)}`, 30, 60 * 60_000);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", "Batas penyimpanan tercapai. Coba lagi nanti.", undefined, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.body ?? {}) as { title?: unknown; input?: unknown };
  if (body.title !== undefined && body.title !== null && typeof body.title !== "string") {
    return jsonError(400, "VALIDATION_ERROR", "Judul harus berupa teks.");
  }
  const resolved = resolveInput(body.input);
  if (!resolved.success) return jsonError(400, "VALIDATION_ERROR", "Input tidak valid.", resolved.issues);

  try {
    const report = await createReport(resolved.data, (body.title as string | undefined) ?? null);
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    return NextResponse.json(
      { id: report.id, url: `${origin}/hasil/${report.id}`, summary: report.summary, createdAt: report.createdAt },
      { status: 201 },
    );
  } catch (error) {
    console.error("[reports] gagal menyimpan", error);
    return jsonError(503, "STORAGE_UNAVAILABLE", "Penyimpanan sedang tidak tersedia. Coba lagi nanti.");
  }
}
