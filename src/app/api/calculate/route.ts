import { NextResponse } from "next/server";
import { calculate, calculateExtras, resolveInput, summarize } from "@/lib/engine";
import { clientIp, jsonError, parseBody } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/calculate
 * Body: CalculatorInput (boleh parsial — dilengkapi nilai default).
 * Query: `view=summary` untuk ringkasan saja, `extras=1` untuk perbandingan & sensitivitas.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`calc:${clientIp(request)}`, 120, 60_000);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", "Terlalu banyak permintaan. Coba lagi sebentar lagi.", undefined, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const resolved = resolveInput(parsed.body);
  if (!resolved.success) {
    return jsonError(400, "VALIDATION_ERROR", "Input tidak valid.", resolved.issues);
  }

  const url = new URL(request.url);
  const result = calculate(resolved.data);
  const summary = summarize(result);
  if (url.searchParams.get("view") === "summary") {
    return NextResponse.json({ summary });
  }
  const extras = url.searchParams.get("extras") === "1" ? calculateExtras(resolved.data, result) : undefined;
  return NextResponse.json({ summary, result, ...(extras ? { extras } : {}) });
}
