import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: { code: string; message: string; issues?: { path: string; message: string }[] };
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  issues?: { path: string; message: string }[],
  headers?: HeadersInit,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, ...(issues ? { issues } : {}) } }, { status, headers });
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}

export class BodyTooLargeError extends Error {}

/** Baca body JSON dengan batas ukuran (default 64 KB). */
export async function readJson(request: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new BodyTooLargeError();
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new BodyTooLargeError();
  if (!text.trim()) return {};
  return JSON.parse(text);
}

/** Tangani kesalahan pembacaan body secara seragam. */
export async function parseBody(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse<ApiErrorBody> }> {
  try {
    return { ok: true, body: await readJson(request) };
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return { ok: false, response: jsonError(413, "BODY_TOO_LARGE", "Ukuran data terlalu besar (maks. 64 KB).") };
    }
    return { ok: false, response: jsonError(400, "INVALID_JSON", "Body bukan JSON yang valid.") };
  }
}
