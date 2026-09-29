import { BATTERY_MODULE_KWH } from "@/lib/data/prices";
import { ROOF_SPACING_FACTOR } from "@/lib/data/panels";
import { HYBRID_INVERTER_SIZES_KW, INVERTER_SIZES_KW, MODEL } from "./constants";
import { annualConsumption, type EngineContext } from "./context";
import { evaluateSystem, simulateDay, yearOneEnergy, type BatteryConfig } from "./simulate";
import type { Evaluation, LimitingFactor, SizingOption, SizingPoint } from "./types";

export interface SizingConstraints {
  maxPanels: number;
  roofMaxPanels: number | null;
  connectionMaxPanels: number | null;
  productionMaxPanels: number;
  binding: LimitingFactor;
}

export function panelKwp(ctx: EngineContext): number {
  return ctx.panel.wp / 1000;
}

export function sizingConstraints(ctx: EngineContext): SizingConstraints {
  const annual = annualConsumption(ctx);
  const perPanelYield = Math.max(1, ctx.pv.annualYield * panelKwp(ctx));
  const ratio = MODEL.maxProductionRatio[ctx.type] ?? 2;
  const productionMaxPanels = Math.max(1, Math.floor((ratio * annual) / perPanelYield));
  const area = ctx.input.roof.areaM2;
  const roofMaxPanels = area ? Math.floor(area / (ctx.panel.areaM2 * ROOF_SPACING_FACTOR)) : null;
  const connectionMaxPanels =
    ctx.input.system.limitToConnection && ctx.type !== "off-grid"
      ? Math.max(1, Math.floor((ctx.va * MODEL.dcAcRatio) / ctx.panel.wp))
      : null;
  const hardMax = Math.floor((MODEL.maxKwp * 1000) / ctx.panel.wp);

  let maxPanels = Math.min(productionMaxPanels, hardMax);
  let binding: LimitingFactor = "production";
  if (connectionMaxPanels !== null && connectionMaxPanels <= maxPanels) {
    maxPanels = connectionMaxPanels;
    binding = "connection";
  }
  if (roofMaxPanels !== null && roofMaxPanels <= maxPanels) {
    maxPanels = roofMaxPanels;
    binding = "roof";
  }
  return { maxPanels: Math.max(0, maxPanels), roofMaxPanels, connectionMaxPanels, productionMaxPanels, binding };
}

// ---------------------------------------------------------------------------
// Baterai
// ---------------------------------------------------------------------------

function roundModules(nominalKwh: number, mode: "ceil" | "round"): number {
  const modules =
    mode === "ceil" ? Math.ceil(nominalKwh / BATTERY_MODULE_KWH - 1e-9) : Math.round(nominalKwh / BATTERY_MODULE_KWH);
  return Math.max(1, modules) * BATTERY_MODULE_KWH;
}

/** Kapasitas baterai (nominal) sesuai jenis sistem & tujuan baterai. */
export function batteryFor(ctx: EngineContext, panelCount: number): BatteryConfig | null {
  if (ctx.type === "on-grid") return null;
  const s = ctx.input.system;
  const b = MODEL.battery;
  const etaD = Math.sqrt(b.roundTripEfficiency);

  if (ctx.type === "off-grid") {
    const maxDaily = Math.max(...ctx.dailyLoad);
    return { capacityKwh: roundModules((maxDaily * s.autonomyDays) / (b.dod * etaD), "ceil"), reserveKwh: 0 };
  }
  if (s.batteryMode === "manual") return { capacityKwh: s.manualBatteryKwh, reserveKwh: 0 };
  if (s.batteryMode === "backup") {
    const usable = (s.backupHours * s.backupLoadW) / 1000;
    return { capacityKwh: roundModules(usable / b.dod, "ceil"), reserveKwh: usable };
  }
  // "surplus": simpan kelebihan siang untuk dipakai malam.
  const kwp = panelCount * panelKwp(ctx);
  let total = 0;
  const pvRow = new Array<number>(24);
  const loadRow = new Array<number>(24);
  for (let m = 0; m < 12; m++) {
    for (let h = 0; h < 24; h++) {
      pvRow[h] = ctx.pv.hourly[m][h] * kwp;
      loadRow[h] = ctx.dailyLoad[m] * ctx.profile[h];
    }
    const day = simulateDay(pvRow, loadRow, null, false);
    const nightDeficit = day.gridImport;
    total += Math.min(day.exported, nightDeficit);
  }
  const usable = total / 12;
  return { capacityKwh: roundModules(usable / b.dod, "round"), reserveKwh: 0 };
}

// ---------------------------------------------------------------------------
// Inverter
// ---------------------------------------------------------------------------

export function inverterFor(kwp: number, type: EngineContext["type"]): { kw: number; count: number; phase: "1 fase" | "3 fase" } {
  const sizes = type === "on-grid" ? INVERTER_SIZES_KW : HYBRID_INVERTER_SIZES_KW;
  const target = kwp / MODEL.dcAcRatio;
  const largest = sizes[sizes.length - 1];
  let kw: number;
  let count = 1;
  if (target <= largest) {
    kw = sizes.find((s) => s >= target * 0.97) ?? largest;
  } else {
    const unit = type === "on-grid" ? 110 : largest;
    count = Math.ceil(target / unit);
    kw = unit;
  }
  return { kw, count, phase: kw * count > 6 ? "3 fase" : "1 fase" };
}

// ---------------------------------------------------------------------------
// Pencarian kapasitas
// ---------------------------------------------------------------------------

function candidateCounts(maxPanels: number): number[] {
  if (maxPanels <= 0) return [];
  if (maxPanels <= 160) return Array.from({ length: maxPanels }, (_, i) => i + 1);
  const points = 100;
  const set = new Set<number>();
  for (let i = 0; i < points; i++) set.add(Math.round(1 + ((maxPanels - 1) * i) / (points - 1)));
  return [...set].sort((a, b) => a - b);
}

function toPoint(ev: Evaluation): SizingPoint {
  return {
    panelCount: ev.panelCount,
    kwp: ev.kwp,
    batteryKwh: ev.batteryKwh,
    capex: ev.capex,
    annualSavings: ev.year1.savings,
    paybackYears: ev.metrics.paybackYears,
    npv: ev.metrics.npv,
    solarFractionPct: ev.year1.solarFractionPct,
    selfConsumptionPct: ev.year1.selfConsumptionPct,
  };
}

function evaluateCount(ctx: EngineContext, n: number): Evaluation {
  const battery = batteryFor(ctx, n);
  return evaluateSystem(ctx, {
    panelCount: n,
    batteryKwh: battery?.capacityKwh ?? 0,
    batteryReserveKwh: battery?.reserveKwh ?? 0,
  });
}

/** Kurva kapasitas (dipakai untuk grafik & mode optimal). */
export function sizingCurve(ctx: EngineContext, maxPanels: number): SizingPoint[] {
  const counts = candidateCounts(maxPanels);
  const points = counts.map((n) => toPoint(evaluateCount(ctx, n)));
  if (counts.length > 0 && maxPanels > 160) {
    // Perhalus di sekitar NPV terbaik.
    let bestIdx = 0;
    points.forEach((p, i) => {
      if (p.npv > points[bestIdx].npv) bestIdx = i;
    });
    const lo = counts[Math.max(0, bestIdx - 1)];
    const hi = counts[Math.min(counts.length - 1, bestIdx + 1)];
    const span = hi - lo;
    const steps = Math.min(span, 60);
    const existing = new Set(counts);
    for (let i = 1; i < steps; i++) {
      const n = Math.round(lo + (span * i) / steps);
      if (!existing.has(n)) {
        existing.add(n);
        points.push(toPoint(evaluateCount(ctx, n)));
      }
    }
    points.sort((a, b) => a.panelCount - b.panelCount);
  }
  return points;
}

function bestNpv(points: SizingPoint[]): SizingPoint | undefined {
  let best: SizingPoint | undefined;
  for (const p of points) if (!best || p.npv > best.npv + 1) best = p;
  return best;
}

function fastest(points: SizingPoint[]): SizingPoint | undefined {
  let best: SizingPoint | undefined;
  for (const p of points) {
    if (p.paybackYears === null) continue;
    if (!best || best.paybackYears === null || p.paybackYears < best.paybackYears - 1e-6) best = p;
  }
  return best;
}

function maxCoverage(points: SizingPoint[]): SizingPoint | undefined {
  if (points.length === 0) return undefined;
  const maxFrac = Math.max(...points.map((p) => p.solarFractionPct));
  return points.find((p) => p.solarFractionPct >= maxFrac - 0.5);
}

/** Cari jumlah panel terkecil yang memenuhi predikat monoton (binary search). */
function smallestSatisfying(lo: number, hi: number, predicate: (n: number) => boolean): number | null {
  if (hi < lo || !predicate(hi)) return null;
  let a = lo;
  let b = hi;
  while (a < b) {
    const mid = Math.floor((a + b) / 2);
    if (predicate(mid)) b = mid;
    else a = mid + 1;
  }
  return a;
}

export interface SizingDecision {
  panelCount: number;
  battery: BatteryConfig | null;
  constraints: SizingConstraints;
  curve: SizingPoint[];
  options: SizingOption[];
  note: string;
  targetReached: boolean | null;
  maxAchievableFractionPct: number | null;
  /** Batas yang membuat target tidak tercapai (atap/daya) bila ada. */
  targetLimitedBy: LimitingFactor;
  offgridUnmetPct: number | null;
  manualExceeds: LimitingFactor;
}

export function decideSize(ctx: EngineContext): SizingDecision {
  const s = ctx.input.system;
  const constraints = sizingConstraints(ctx);
  const maxPanels = Math.max(1, constraints.maxPanels);
  const curve = sizingCurve(ctx, maxPanels);
  const kwpPerPanel = panelKwp(ctx);

  let panelCount = 1;
  let note = "";
  let targetReached: boolean | null = null;
  let maxAchievableFractionPct: number | null = null;
  let targetLimitedBy: LimitingFactor = null;
  let offgridUnmetPct: number | null = null;
  let manualExceeds: LimitingFactor = null;

  const fraction = (n: number) => yearOneEnergy(ctx, n * kwpPerPanel, batteryFor(ctx, n)).solarFraction;

  if (ctx.type === "off-grid" && s.sizingMode !== "manual") {
    const ok = (n: number) => {
      const e = yearOneEnergy(ctx, n * kwpPerPanel, batteryFor(ctx, n));
      return e.consumption > 0 && e.unmet / e.consumption <= 0.01 && e.worstMonthUnmetFrac <= 0.03;
    };
    const n = smallestSatisfying(1, maxPanels, ok);
    panelCount = n ?? maxPanels;
    const e = yearOneEnergy(ctx, panelCount * kwpPerPanel, batteryFor(ctx, panelCount));
    offgridUnmetPct = e.consumption > 0 ? (e.unmet / e.consumption) * 100 : 0;
    note =
      n !== null
        ? `Kapasitas terkecil yang memenuhi ≥99% kebutuhan sepanjang tahun dengan otonomi ${s.autonomyDays} hari.`
        : "Kapasitas maksimum yang memungkinkan; kebutuhan belum terpenuhi sepenuhnya.";
  } else if (s.sizingMode === "manual") {
    panelCount = Math.max(1, Math.round((s.manualKwp * 1000) / ctx.panel.wp));
    if (constraints.roofMaxPanels !== null && panelCount > constraints.roofMaxPanels) manualExceeds = "roof";
    else if (constraints.connectionMaxPanels !== null && panelCount > constraints.connectionMaxPanels)
      manualExceeds = "connection";
    note = "Kapasitas sesuai input manual Anda (dibulatkan ke jumlah panel).";
    if (ctx.type === "off-grid") {
      const e = yearOneEnergy(ctx, panelCount * kwpPerPanel, batteryFor(ctx, panelCount));
      offgridUnmetPct = e.consumption > 0 ? (e.unmet / e.consumption) * 100 : 0;
    }
  } else if (s.sizingMode === "target") {
    const target = s.targetPct / 100;
    const maxFrac = fraction(maxPanels);
    maxAchievableFractionPct = maxFrac * 100;
    const threshold = maxFrac >= target ? target : maxFrac * 0.98;
    targetReached = maxFrac >= target;
    if (!targetReached && constraints.binding !== "production") targetLimitedBy = constraints.binding;
    panelCount = smallestSatisfying(1, maxPanels, (n) => fraction(n) >= threshold - 1e-9) ?? maxPanels;
    note = targetReached
      ? `Kapasitas terkecil untuk memenuhi ${s.targetPct}% kebutuhan listrik dari energi surya.`
      : `Target ${s.targetPct}% tidak tercapai; dipilih kapasitas yang mendekati porsi maksimum ±${Math.round(maxFrac * 100)}%.`;
  } else {
    const best = bestNpv(curve);
    panelCount = best?.panelCount ?? 1;
    note = "Kapasitas dengan nilai ekonomi terbaik (NPV tertinggi) selama umur sistem.";
  }

  const chosenPoint = curve.find((p) => p.panelCount === panelCount) ?? toPoint(evaluateCount(ctx, panelCount));
  const options: SizingOption[] = [
    {
      id: "recommended",
      label: s.sizingMode === "optimal" || ctx.type === "off-grid" ? "Rekomendasi" : "Pilihan Anda",
      description: note,
      point: chosenPoint,
    },
  ];
  const addOption = (opt: SizingOption | null) => {
    if (!opt) return;
    if (options.some((o) => o.point.panelCount === opt.point.panelCount)) return;
    options.push(opt);
  };
  const isOffgrid = ctx.type === "off-grid";
  const npvBest = isOffgrid ? undefined : bestNpv(curve);
  if (npvBest)
    addOption({
      id: "best-npv",
      label: "Nilai terbaik",
      description: "NPV tertinggi — keuntungan bersih terbesar selama umur sistem.",
      point: npvBest,
    });
  const fast = isOffgrid ? undefined : fastest(curve);
  if (fast && (chosenPoint.paybackYears === null || (fast.paybackYears ?? 0) < chosenPoint.paybackYears - 0.1))
    addOption({
      id: "fastest",
      label: "Balik modal tercepat",
      description: "Investasi lebih kecil dengan periode balik modal paling singkat.",
      point: fast,
    });
  const coverage = isOffgrid ? undefined : maxCoverage(curve);
  if (coverage && coverage.solarFractionPct > chosenPoint.solarFractionPct + 1)
    addOption({
      id: "coverage",
      label: "Energi hijau maksimal",
      description: "Porsi energi surya tertinggi yang masih dapat dimanfaatkan sistem ini.",
      point: coverage,
    });

  return {
    panelCount,
    battery: batteryFor(ctx, panelCount),
    constraints,
    curve,
    options,
    note,
    targetReached,
    maxAchievableFractionPct,
    targetLimitedBy,
    offgridUnmetPct,
    manualExceeds,
  };
}
