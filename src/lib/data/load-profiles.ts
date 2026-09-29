/**
 * Templat profil pemakaian listrik 24 jam (bobot relatif per jam, jam lokal 00–23).
 * Dinormalisasi oleh engine sehingga total = 1.
 */

export type LoadProfileId = "rumah-malam" | "rumah-siang" | "kantor" | "toko" | "usaha-24" | "kustom";

export interface LoadProfileTemplate {
  id: LoadProfileId;
  label: string;
  shortLabel: string;
  description: string;
  weights: number[];
}

/** Jam siang yang dipakai untuk porsi pemakaian siang: 06.00–18.00. */
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 18;

export const LOAD_PROFILES: LoadProfileTemplate[] = [
  {
    id: "rumah-malam",
    label: "Rumah — aktif pagi & malam",
    shortLabel: "Rumah (pagi & malam)",
    description: "Penghuni bekerja/sekolah di luar rumah; pemakaian terbesar sore–malam (AC kamar, TV, masak).",
    weights: [4.2, 3.9, 3.7, 3.6, 3.7, 4.3, 4.6, 3.9, 2.9, 2.5, 2.4, 2.5, 2.7, 2.6, 2.5, 2.7, 3.3, 4.5, 6.3, 7.0, 6.8, 6.2, 5.5, 4.8],
  },
  {
    id: "rumah-siang",
    label: "Rumah — banyak aktivitas siang",
    shortLabel: "Rumah (aktif siang)",
    description: "Kerja dari rumah, ada lansia/ART, atau usaha rumahan; AC & peralatan menyala di siang hari.",
    weights: [3.6, 3.3, 3.1, 3.0, 3.1, 3.6, 4.0, 4.2, 4.4, 4.7, 5.0, 5.3, 5.5, 5.4, 5.2, 4.9, 4.6, 4.7, 5.4, 5.6, 5.3, 4.8, 4.3, 3.9],
  },
  {
    id: "kantor",
    label: "Kantor / sekolah / toko jam kerja",
    shortLabel: "Kantor (jam kerja)",
    description: "Operasional sekitar 08.00–17.00; pemakaian malam hanya beban dasar.",
    weights: [1.6, 1.5, 1.5, 1.5, 1.5, 1.7, 2.5, 4.5, 7.2, 8.3, 8.7, 8.8, 8.2, 8.6, 8.6, 8.3, 7.0, 4.6, 3.0, 2.4, 2.1, 1.9, 1.8, 1.7],
  },
  {
    id: "toko",
    label: "Toko / restoran (siang–malam)",
    shortLabel: "Toko (siang–malam)",
    description: "Buka sekitar 09.00–22.00 dengan pendingin & penerangan; puncak sore–malam.",
    weights: [2.0, 1.8, 1.7, 1.7, 1.7, 1.8, 2.0, 2.4, 3.2, 4.2, 5.4, 6.0, 6.3, 6.2, 6.0, 5.9, 6.0, 6.2, 6.6, 6.8, 6.5, 5.6, 3.8, 2.6],
  },
  {
    id: "usaha-24",
    label: "Usaha / industri 24 jam",
    shortLabel: "Usaha 24 jam",
    description: "Pabrik tiga shift, cold storage, hotel, atau rumah sakit dengan beban relatif rata.",
    weights: [3.7, 3.6, 3.6, 3.6, 3.6, 3.7, 3.9, 4.2, 4.5, 4.6, 4.7, 4.7, 4.5, 4.7, 4.7, 4.6, 4.4, 4.3, 4.4, 4.4, 4.2, 4.0, 3.9, 3.8],
  },
  {
    id: "kustom",
    label: "Atur sendiri",
    shortLabel: "Kustom",
    description: "Tentukan sendiri berapa persen listrik dipakai pada siang hari (06.00–18.00).",
    weights: [],
  },
];

/** Bentuk dasar pemakaian siang & malam untuk profil kustom. */
const DAY_SHAPE = [0, 0, 0, 0, 0, 0, 3.0, 5.0, 7.5, 8.5, 9.0, 9.2, 8.8, 9.0, 8.8, 8.3, 7.2, 5.5, 0, 0, 0, 0, 0, 0];
const NIGHT_SHAPE = [5.2, 4.8, 4.5, 4.4, 4.5, 5.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7.5, 8.4, 8.2, 7.6, 6.8, 6.0];

export function normalize(weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  return total > 0 ? weights.map((w) => w / total) : weights.map(() => 1 / weights.length);
}

export function daytimeShare(profile: number[]): number {
  let day = 0;
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) day += profile[h];
  const total = profile.reduce((a, b) => a + b, 0);
  return total > 0 ? day / total : 0;
}

/** Profil kustom dengan porsi siang tertentu (0–1). */
export function customProfile(dayShare: number): number[] {
  const s = Math.min(0.95, Math.max(0.05, dayShare));
  const day = normalize(DAY_SHAPE);
  const night = normalize(NIGHT_SHAPE);
  return day.map((d, h) => s * d + (1 - s) * night[h]);
}

/** Geser porsi siang sebuah profil (untuk analisis sensitivitas). */
export function shiftDaytimeShare(profile: number[], targetShare: number): number[] {
  const current = daytimeShare(profile);
  const s = Math.min(0.95, Math.max(0.05, targetShare));
  if (current <= 0 || current >= 1) return customProfile(s);
  const dayFactor = s / current;
  const nightFactor = (1 - s) / (1 - current);
  return normalize(profile.map((w, h) => w * (h >= DAY_START_HOUR && h < DAY_END_HOUR ? dayFactor : nightFactor)));
}

export function getLoadProfile(id: LoadProfileId): LoadProfileTemplate {
  return LOAD_PROFILES.find((p) => p.id === id) ?? LOAD_PROFILES[0];
}

/** Profil ternormalisasi (24 nilai, total 1) untuk templat atau kustom. */
export function resolveProfile(id: LoadProfileId, customDaySharePct: number): number[] {
  if (id === "kustom") return customProfile(customDaySharePct / 100);
  return normalize(getLoadProfile(id).weights);
}
