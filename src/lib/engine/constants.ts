export const ENGINE_VERSION = "1.0.0";

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** Hari rata-rata tiap bulan (Klein, 1977) — nomor hari dalam tahun. */
export const AVG_DAY_OF_MONTH = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];

/** Parameter model PV yang tidak diekspos sebagai input pengguna. */
export const MODEL = {
  /** Resolusi simulasi radiasi (jam). */
  stepHours: 1 / 6,
  albedo: 0.2,
  /** NOCT efektif untuk pemasangan di atap (°C). */
  noctEffective: 48,
  /** Amplitudo variasi suhu udara harian (°C). */
  dailyTempAmplitude: 4,
  /** Jam suhu udara maksimum (jam lokal). */
  tempPeakHour: 14.5,
  inverterEfficiency: 0.975,
  dcAcRatio: 1.15,
  /**
   * Susut lain (fraksi): optik/sudut datang & cahaya rendah, kotoran, mismatch,
   * kabel DC, kabel AC, ketersediaan.
   */
  losses: { optical: 0.03, soiling: 0.04, mismatch: 0.02, dcWiring: 0.015, acWiring: 0.005, availability: 0.01 },
  battery: {
    dod: 0.9,
    roundTripEfficiency: 0.92,
    /** Batas daya pengisian/pengosongan sebagai fraksi kapasitas per jam (C-rate). */
    cRate: 0.5,
    /** Penurunan kapasitas per tahun. */
    fadePerYear: 0.02,
    /** Biaya penggantian relatif terhadap harga awal (penurunan harga). */
    replacementCostFactor: 0.7,
  },
  /** Jumlah tahun terakhir tanpa penggantian komponen. */
  noReplacementFinalYears: 2,
  treeKgCo2PerYear: 22,
  carKgCo2PerKm: 0.15,
  gensetKgCo2PerKwh: 0.8,
  minimumBillHours: 40,
  /** Batas produksi kandidat relatif terhadap konsumsi tahunan. */
  maxProductionRatio: { "on-grid": 2, hybrid: 2, "off-grid": 3 } as Record<string, number>,
  maxKwp: 10_000,
} as const;

export function lossFactor(shadingPct: number): number {
  const l = MODEL.losses;
  return (
    (1 - l.optical) *
    (1 - l.soiling) *
    (1 - l.mismatch) *
    (1 - l.dcWiring) *
    (1 - l.acWiring) *
    (1 - l.availability) *
    (1 - Math.min(0.9, Math.max(0, shadingPct / 100)))
  );
}

/** Ukuran inverter standar (kW AC). */
export const INVERTER_SIZES_KW = [
  1.5, 2, 3, 3.6, 4, 5, 6, 8, 10, 12, 15, 17, 20, 25, 30, 36, 40, 50, 60, 75, 100, 110, 125,
];
export const HYBRID_INVERTER_SIZES_KW = [3, 3.6, 5, 6, 8, 10, 12, 15, 20, 25, 30, 50];
