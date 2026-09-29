/**
 * Asumsi harga pasar PLTS atap di Indonesia (estimasi 2026, kelas "Standar").
 * Dirangkum dari kisaran publik 2025–2026: rumah tangga ±Rp11–19 juta/kWp,
 * komersial/industri ±Rp10–13 juta/kWp, baterai LiFePO4 48 V 100 Ah ±Rp12–20 juta.
 */

export type PriceTier = "ekonomis" | "standar" | "premium";

export const PRICE_LAST_UPDATED = "2026-09-01";

/** Titik acuan harga sistem on-grid terpasang (kWp → Rp per kWp). */
export const PRICE_ANCHORS: ReadonlyArray<readonly [kwp: number, rpPerKwp: number]> = [
  [1, 17_000_000],
  [2, 15_500_000],
  [3, 14_500_000],
  [5, 13_500_000],
  [10, 12_500_000],
  [20, 11_500_000],
  [50, 10_500_000],
  [100, 9_750_000],
  [250, 9_000_000],
  [500, 8_500_000],
  [1000, 8_000_000],
];

export const PRICE_MAX_PER_KWP = 20_000_000;

export const PRICE_TIERS: Record<PriceTier, { label: string; multiplier: number; description: string }> = {
  ekonomis: {
    label: "Ekonomis",
    multiplier: 0.85,
    description: "Merek lapis kedua, garansi standar, cocok untuk anggaran terbatas.",
  },
  standar: {
    label: "Standar",
    multiplier: 1,
    description: "Panel tier-1 & inverter bermerek dengan garansi resmi (paling umum).",
  },
  premium: {
    label: "Premium",
    multiplier: 1.2,
    description: "Panel efisiensi tinggi, inverter premium, monitoring & layanan purna jual lengkap.",
  },
};

/** Tambahan harga per kWp untuk inverter hybrid / off-grid dibanding on-grid. */
export const SYSTEM_PREMIUM_PER_KWP = {
  "on-grid": 0,
  hybrid: 2_000_000,
  "off-grid": 2_500_000,
} as const;

export const DEFAULT_BATTERY_PRICE_PER_KWH = 4_500_000;
/** Ukuran modul baterai standar (51,2 V × 100 Ah). */
export const BATTERY_MODULE_KWH = 5.12;

/** Estimasi komposisi biaya sistem PV (untuk rincian yang ditampilkan). */
export const CAPEX_SHARES: ReadonlyArray<{ key: string; label: string; share: number }> = [
  { key: "panel", label: "Panel surya", share: 0.38 },
  { key: "inverter", label: "Inverter", share: 0.17 },
  { key: "mounting", label: "Struktur & dudukan", share: 0.1 },
  { key: "bos", label: "Kabel, proteksi & panel listrik", share: 0.12 },
  { key: "install", label: "Jasa instalasi & komisioning", share: 0.15 },
  { key: "permit", label: "Desain, perizinan & administrasi", share: 0.08 },
];

/**
 * Harga sistem PV terpasang per kWp (on-grid, kelas Standar) dengan interpolasi
 * log-linear terhadap kapasitas.
 */
export function basePricePerKwp(kwp: number): number {
  const anchors = PRICE_ANCHORS;
  if (kwp <= 0) return anchors[0][1];
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (kwp >= last[0]) return last[1];
  if (kwp <= first[0]) {
    // Ekstrapolasi segmen pertama untuk sistem < 1 kWp, dibatasi harga maksimum.
    const second = anchors[1];
    const slope = (second[1] - first[1]) / Math.log(second[0] / first[0]);
    return Math.min(PRICE_MAX_PER_KWP, first[1] + slope * Math.log(kwp / first[0]));
  }
  for (let i = 0; i < anchors.length - 1; i++) {
    const [k0, p0] = anchors[i];
    const [k1, p1] = anchors[i + 1];
    if (kwp >= k0 && kwp <= k1) {
      const t = Math.log(kwp / k0) / Math.log(k1 / k0);
      return p0 + t * (p1 - p0);
    }
  }
  return last[1];
}
