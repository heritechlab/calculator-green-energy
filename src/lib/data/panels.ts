/** Pilihan modul surya umum di pasar Indonesia. */
export interface PanelSpec {
  id: string;
  wp: number;
  /** Luas modul (m²). */
  areaM2: number;
  efficiencyPct: number;
  technology: string;
  /** Koefisien suhu daya (fraksi per °C, negatif). */
  tempCoeff: number;
  label: string;
}

export const PANELS: PanelSpec[] = [
  {
    id: "450",
    wp: 450,
    areaM2: 2.17,
    efficiencyPct: 20.7,
    technology: "Mono PERC",
    tempCoeff: -0.0035,
    label: "450 Wp · Mono PERC",
  },
  {
    id: "550",
    wp: 550,
    areaM2: 2.58,
    efficiencyPct: 21.3,
    technology: "Mono PERC",
    tempCoeff: -0.0035,
    label: "550 Wp · Mono PERC",
  },
  {
    id: "580",
    wp: 580,
    areaM2: 2.58,
    efficiencyPct: 22.5,
    technology: "N-type TOPCon",
    tempCoeff: -0.003,
    label: "580 Wp · TOPCon",
  },
  {
    id: "620",
    wp: 620,
    areaM2: 2.7,
    efficiencyPct: 22.9,
    technology: "N-type TOPCon",
    tempCoeff: -0.003,
    label: "620 Wp · TOPCon",
  },
  {
    id: "700",
    wp: 700,
    areaM2: 3.11,
    efficiencyPct: 22.5,
    technology: "HJT/TOPCon 210",
    tempCoeff: -0.0026,
    label: "700 Wp · HJT",
  },
];

export const DEFAULT_PANEL_ID = "550";

/** Faktor ruang (akses perawatan, jarak antarbaris, tepi atap). */
export const ROOF_SPACING_FACTOR = 1.2;

export function getPanel(id: string): PanelSpec {
  return PANELS.find((p) => p.id === id) ?? PANELS.find((p) => p.id === DEFAULT_PANEL_ID)!;
}
