/**
 * Tarif tenaga listrik PLN (Rp/kWh).
 *
 * Sumber: penetapan tarif tenaga listrik Kementerian ESDM untuk triwulan III 2026
 * (Juli–September 2026) — seluruh golongan nonsubsidi ditetapkan tetap, sama dengan
 * periode sebelumnya. Golongan TM/TT memakai tarif LWBP karena PLTS berproduksi di
 * luar waktu beban puncak (WBP 17.00–22.00).
 */

export type CustomerCategory = "rumah-tangga" | "bisnis" | "industri" | "lainnya";

export interface TariffClass {
  id: string;
  /** Kode golongan resmi, mis. "R-1/TR". */
  code: string;
  /** Label singkat untuk UI. */
  label: string;
  category: CustomerCategory;
  /** Tarif dasar Rp/kWh (sebelum pajak). */
  rate: number;
  subsidized: boolean;
  /** Pilihan daya tersambung (VA). */
  vaOptions: number[];
  defaultVa: number;
  /** PPN efektif yang berlaku (fraksi), mis. 0.11 untuk rumah tangga ≥ 6.600 VA. */
  vat: number;
  voltage: "TR" | "TM" | "TT";
  note?: string;
}

export const TARIFF_LAST_UPDATED = "2026-07-01";
export const TARIFF_PERIOD_LABEL = "Triwulan III 2026 (Juli–September 2026)";

const TR_LARGE_VA = [
  6600, 7700, 10600, 11000, 13200, 16500, 22000, 23000, 33000, 41500, 53000, 66000, 82500, 105000,
  131000, 147000, 164000, 197000,
];
const TM_VA = [
  240000, 345000, 415000, 555000, 690000, 865000, 1110000, 1385000, 1730000, 2180000, 2770000, 3465000,
  4330000, 5540000,
];

export const TARIFFS: TariffClass[] = [
  {
    id: "R1-450",
    code: "R-1/TR",
    label: "R-1 · 450 VA (subsidi)",
    category: "rumah-tangga",
    rate: 415,
    subsidized: true,
    vaOptions: [450],
    defaultVa: 450,
    vat: 0,
    voltage: "TR",
    note: "Tarif bersubsidi rata-rata.",
  },
  {
    id: "R1-900S",
    code: "R-1/TR",
    label: "R-1 · 900 VA (subsidi)",
    category: "rumah-tangga",
    rate: 605,
    subsidized: true,
    vaOptions: [900],
    defaultVa: 900,
    vat: 0,
    voltage: "TR",
    note: "Tarif bersubsidi rata-rata.",
  },
  {
    id: "R1-900",
    code: "R-1/TR",
    label: "R-1 · 900 VA (nonsubsidi/RTM)",
    category: "rumah-tangga",
    rate: 1352,
    subsidized: false,
    vaOptions: [900],
    defaultVa: 900,
    vat: 0,
    voltage: "TR",
  },
  {
    id: "R1-1300",
    code: "R-1/TR",
    label: "R-1 · 1.300 VA",
    category: "rumah-tangga",
    rate: 1444.7,
    subsidized: false,
    vaOptions: [1300],
    defaultVa: 1300,
    vat: 0,
    voltage: "TR",
  },
  {
    id: "R1-2200",
    code: "R-1/TR",
    label: "R-1 · 2.200 VA",
    category: "rumah-tangga",
    rate: 1444.7,
    subsidized: false,
    vaOptions: [2200],
    defaultVa: 2200,
    vat: 0,
    voltage: "TR",
  },
  {
    id: "R2",
    code: "R-2/TR",
    label: "R-2 · 3.500–5.500 VA",
    category: "rumah-tangga",
    rate: 1699.53,
    subsidized: false,
    vaOptions: [3500, 4400, 5500],
    defaultVa: 3500,
    vat: 0,
    voltage: "TR",
  },
  {
    id: "R3",
    code: "R-3/TR",
    label: "R-3 · ≥ 6.600 VA",
    category: "rumah-tangga",
    rate: 1699.53,
    subsidized: false,
    vaOptions: TR_LARGE_VA,
    defaultVa: 6600,
    vat: 0.11,
    voltage: "TR",
    note: "Dikenakan PPN (efektif 11%).",
  },
  {
    id: "B2",
    code: "B-2/TR",
    label: "B-2 · Bisnis 6.600 VA–200 kVA",
    category: "bisnis",
    rate: 1444.7,
    subsidized: false,
    vaOptions: TR_LARGE_VA,
    defaultVa: 16500,
    vat: 0,
    voltage: "TR",
  },
  {
    id: "B3",
    code: "B-3/TM",
    label: "B-3 · Bisnis > 200 kVA (TM)",
    category: "bisnis",
    rate: 1114.74,
    subsidized: false,
    vaOptions: TM_VA,
    defaultVa: 345000,
    vat: 0,
    voltage: "TM",
    note: "Tarif LWBP; PLTS mengurangi pemakaian di luar beban puncak.",
  },
  {
    id: "I3",
    code: "I-3/TM",
    label: "I-3 · Industri > 200 kVA (TM)",
    category: "industri",
    rate: 1114.74,
    subsidized: false,
    vaOptions: TM_VA,
    defaultVa: 555000,
    vat: 0,
    voltage: "TM",
    note: "Tarif LWBP; PLTS mengurangi pemakaian di luar beban puncak.",
  },
  {
    id: "I4",
    code: "I-4/TT",
    label: "I-4 · Industri ≥ 30.000 kVA (TT)",
    category: "industri",
    rate: 996.74,
    subsidized: false,
    vaOptions: [30000000, 40000000, 60000000],
    defaultVa: 30000000,
    vat: 0,
    voltage: "TT",
  },
  {
    id: "P1",
    code: "P-1/TR",
    label: "P-1 · Kantor pemerintah 6.600 VA–200 kVA",
    category: "lainnya",
    rate: 1699.53,
    subsidized: false,
    vaOptions: TR_LARGE_VA,
    defaultVa: 16500,
    vat: 0,
    voltage: "TR",
  },
  {
    id: "P2",
    code: "P-2/TM",
    label: "P-2 · Kantor pemerintah > 200 kVA (TM)",
    category: "lainnya",
    rate: 1522.88,
    subsidized: false,
    vaOptions: TM_VA,
    defaultVa: 345000,
    vat: 0,
    voltage: "TM",
    note: "Tarif LWBP.",
  },
  {
    id: "L",
    code: "L/TR,TM,TT",
    label: "L · Layanan khusus",
    category: "lainnya",
    rate: 1644.52,
    subsidized: false,
    vaOptions: [2200, 3500, 5500, 6600, 11000, 16500, 23000, 33000, 53000],
    defaultVa: 6600,
    vat: 0,
    voltage: "TR",
  },
];

export const CUSTOM_TARIFF_ID = "custom";

export const CATEGORY_LABELS: Record<CustomerCategory, string> = {
  "rumah-tangga": "Rumah tangga",
  bisnis: "Bisnis",
  industri: "Industri",
  lainnya: "Lainnya",
};

/** Jam nyala untuk rekening minimum pelanggan pascabayar. */
export const MINIMUM_BILL_HOURS = 40;

export function getTariff(id: string): TariffClass | undefined {
  return TARIFFS.find((t) => t.id === id);
}

export function tariffsByCategory(category: CustomerCategory): TariffClass[] {
  return TARIFFS.filter((t) => t.category === category);
}

export function formatVa(va: number): string {
  if (va >= 1_000_000) return `${(va / 1_000_000).toLocaleString("id-ID")} MVA`;
  if (va >= 200_000) return `${(va / 1000).toLocaleString("id-ID")} kVA`;
  return `${va.toLocaleString("id-ID")} VA`;
}
