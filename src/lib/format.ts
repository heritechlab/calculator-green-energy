/** Format angka & mata uang untuk locale Indonesia (id-ID). */

const LOCALE = "id-ID";

export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "–";
  return value.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Angka dengan desimal maksimum (tanpa nol di belakang). */
export function formatDecimal(value: number, maxDigits = 1): string {
  if (!Number.isFinite(value)) return "–";
  return value.toLocaleString(LOCALE, { maximumFractionDigits: maxDigits });
}

export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) return "–";
  const sign = value < 0 ? "-" : "";
  return `${sign}Rp${Math.round(Math.abs(value)).toLocaleString(LOCALE)}`;
}

/** Rupiah ringkas: Rp1,2 jt · Rp850 rb · Rp1,05 M. */
export function formatRupiahCompact(value: number): string {
  if (!Number.isFinite(value)) return "–";
  const sign = value < 0 ? "-" : "";
  const v = Math.abs(value);
  // Ambang memperhitungkan pembulatan (mis. 999.800 → "Rp1 jt", bukan "Rp1.000 rb").
  if (v >= 999.995e9) return `${sign}Rp${formatDecimal(v / 1e12, 2)} T`;
  if (v >= 999.5e6) return `${sign}Rp${formatDecimal(v / 1e9, 2)} M`;
  if (v >= 999_500) return `${sign}Rp${formatDecimal(v / 1e6, v >= 99.95e6 ? 0 : 1)} jt`;
  if (v >= 999.5) return `${sign}Rp${formatDecimal(v / 1e3, 0)} rb`;
  return `${sign}Rp${Math.round(v)}`;
}

export function formatPercent(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "–";
  return `${formatNumber(value, digits)}%`;
}

export function formatKwh(value: number): string {
  if (!Number.isFinite(value)) return "–";
  if (Math.abs(value) >= 1e6) return `${formatDecimal(value / 1e6, 2)} GWh`;
  if (Math.abs(value) >= 1e4) return `${formatDecimal(value / 1e3, 1)} MWh`;
  return `${formatNumber(value, value < 10 ? 1 : 0)} kWh`;
}

export function formatKwp(value: number): string {
  if (!Number.isFinite(value)) return "–";
  if (value >= 1000) return `${formatDecimal(value / 1000, 2)} MWp`;
  return `${formatDecimal(value, 2)} kWp`;
}

export function formatKg(value: number): string {
  if (!Number.isFinite(value)) return "–";
  if (value >= 1000) return `${formatDecimal(value / 1000, 1)} ton`;
  return `${formatNumber(value)} kg`;
}

/** "7 tahun 1 bulan" · "8 bulan" · null → "Tidak balik modal". */
export function formatYears(years: number | null, fallback = "Tidak balik modal"): string {
  if (years === null || !Number.isFinite(years)) return fallback;
  if (years <= 0) return "Langsung";
  let whole = Math.floor(years);
  let months = Math.round((years - whole) * 12);
  if (months === 12) {
    whole += 1;
    months = 0;
  }
  if (whole === 0) return `${months} bulan`;
  if (months === 0) return `${whole} tahun`;
  return `${whole} tahun ${months} bulan`;
}

/** Durasi ringkas: "9 th 5 bln". */
export function formatYearsCompact(years: number | null, fallback = "–"): string {
  return formatYears(years, fallback).replace(" tahun", " th").replace(" bulan", " bln");
}

/** Versi pendek: "7,1 thn". */
export function formatYearsShort(years: number | null): string {
  if (years === null || !Number.isFinite(years)) return "–";
  return `${formatDecimal(years, 1)} thn`;
}

/** Parse input Rupiah/angka bebas ("Rp 1.500.000", "1,5") menjadi number. */
export function parseLocaleNumber(text: string): number | null {
  const cleaned = text.replace(/[^0-9,.-]/g, "");
  if (!cleaned) return null;
  // Format id-ID: titik = ribuan, koma = desimal.
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
