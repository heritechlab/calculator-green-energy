<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SuryaHitung — catatan proyek

Kalkulator kebutuhan PLTS & balik modal (Next.js 16 App Router, TypeScript, Tailwind 4, Drizzle + libSQL). Bahasa produk: Indonesia.
Spesifikasi produk: `docs/PRD.md`.

## Perintah

- `npm run dev` — server pengembangan (buka lewat `http://localhost:3000`, bukan `127.0.0.1`, agar HMR tidak diblokir).
- `npm run check` — lint + typecheck + format check + unit test (wajib lulus sebelum commit).
- `npm run build` — build produksi. `npm run test:e2e` — Playwright (butuh build; set `PLAYWRIGHT_CHROMIUM_PATH` bila memakai Chromium sistem).
- `npm run db:generate` — buat migrasi SQL setelah mengubah `src/lib/db/schema.ts` (migrasi dijalankan otomatis saat runtime).

## Struktur & aturan

- `src/lib/engine/` adalah engine perhitungan murni (tanpa DOM/Node API) yang dipakai peramban **dan** server. Setiap perubahan rumus wajib disertai uji di `tests/` dan pembaruan halaman `/metodologi` bila asumsi berubah.
- Data referensi (tarif PLN, kota & radiasi, harga, panel, profil beban) ada di `src/lib/data/` — perbarui `*_LAST_UPDATED` saat mengubah nilainya.
- Input divalidasi dengan skema Zod bersama (`src/lib/engine/input.ts`); API menerima input parsial melalui `resolveInput`.
- Warna seri grafik sudah divalidasi (kontras & buta warna) — pakai konstanta `SERIES` di `src/components/results/charts/chart-kit.tsx`, jangan menambah warna baru tanpa validasi. Tidak ada grafik dua sumbu-Y.
- Teks UI berbahasa Indonesia; format angka memakai `src/lib/format.ts` (id-ID).
