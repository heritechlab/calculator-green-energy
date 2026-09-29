import { SEASON_PATTERNS, getCity } from "@/lib/data/locations";
import { daytimeShare, getLoadProfile } from "@/lib/data/load-profiles";
import { ROOF_SPACING_FACTOR } from "@/lib/data/panels";
import { BATTERY_MODULE_KWH, PRICE_TIERS } from "@/lib/data/prices";
import {
  formatDecimal,
  formatKwh,
  formatNumber,
  formatPercent,
  formatRupiah,
  formatYears,
} from "@/lib/format";
import { ENGINE_VERSION, MODEL } from "./constants";
import { annualConsumption, buildContext, buildPvProfile, type EngineContext } from "./context";
import type { CalculatorInput, Orientation, SystemType } from "./input";
import { evaluateSystem } from "./simulate";
import { decideSize, inverterFor, panelKwp, type SizingDecision } from "./sizing";
import type { PvProfile } from "./solar";
import type {
  AssumptionItem,
  CalculationExtras,
  CalculationResult,
  ComparisonItem,
  Evaluation,
  Feasibility,
  FeasibilityLevel,
  SensitivityItem,
  Warning,
} from "./types";

export const SYSTEM_LABELS: Record<SystemType, string> = {
  "on-grid": "On-Grid",
  hybrid: "Hybrid",
  "off-grid": "Off-Grid",
};

export const ORIENTATION_LABELS: Record<Orientation, string> = {
  optimal: "Optimal (menghadap khatulistiwa)",
  N: "Utara",
  NE: "Timur Laut",
  E: "Timur",
  SE: "Tenggara",
  S: "Selatan",
  SW: "Barat Daya",
  W: "Barat",
  NW: "Barat Laut",
  EW: "Timur–Barat (terbagi)",
};

export const FEASIBILITY_LABELS: Record<FeasibilityLevel, string> = {
  "sangat-layak": "Sangat layak",
  layak: "Layak",
  "kurang-layak": "Kurang layak",
  "tidak-layak": "Belum layak",
};

export function feasibilityOf(paybackYears: number | null, npv: number): FeasibilityLevel {
  if (paybackYears === null || npv <= 0) return "tidak-layak";
  if (paybackYears <= 7) return "sangat-layak";
  if (paybackYears <= 10) return "layak";
  return "kurang-layak";
}

function feasibilityDetail(level: FeasibilityLevel, ev: Evaluation, lifetime: number): Feasibility {
  const payback = formatYears(ev.metrics.paybackYears);
  const summaries: Record<FeasibilityLevel, string> = {
    "sangat-layak": `Investasi kembali dalam ${payback}, lalu PLTS terus menghasilkan penghematan hingga tahun ke-${lifetime}.`,
    layak: `Investasi kembali dalam ${payback} dengan keuntungan bersih positif selama umur sistem.`,
    "kurang-layak": `Menguntungkan dalam jangka panjang, namun balik modal cukup lama (${payback}).`,
    "tidak-layak":
      ev.metrics.paybackYears === null
        ? `Penghematan belum cukup untuk menutup investasi dalam ${lifetime} tahun dengan asumsi saat ini.`
        : `Balik modal ${payback}, tetapi imbal hasilnya di bawah tingkat diskonto (NPV negatif).`,
  };
  return { level, label: FEASIBILITY_LABELS[level], summary: summaries[level] };
}

function solarSourceLabel(input: CalculatorInput): string {
  switch (input.location.source) {
    case "nasa-power":
      return "NASA POWER (klimatologi satelit berdasarkan koordinat)";
    case "manual":
      return "Input manual pengguna";
    default: {
      const city = getCity(input.location.cityId);
      const pattern = city ? SEASON_PATTERNS[city.pattern].label : "pola regional";
      return `Estimasi dataset kota — ${pattern}`;
    }
  }
}

export interface CalculateOptions {
  pvProfile?: PvProfile;
}

export function calculate(input: CalculatorInput, options: CalculateOptions = {}): CalculationResult {
  const ctx = buildContext(input, { pvProfile: options.pvProfile });
  const decision = decideSize(ctx);
  const ev = evaluateSystem(ctx, {
    panelCount: decision.panelCount,
    batteryKwh: decision.battery?.capacityKwh ?? 0,
    batteryReserveKwh: decision.battery?.reserveKwh ?? 0,
    detail: true,
  });
  const evaluation = ev as CalculationResult["evaluation"];

  const kwp = ev.kwp;
  const inverter = inverterFor(kwp, ctx.type);
  const annualKwh = annualConsumption(ctx);
  const netZeroKwp = ctx.pv.annualYield > 0 ? annualKwh / ctx.pv.annualYield : 0;
  const netZeroPanels = Math.ceil((netZeroKwp * 1000) / ctx.panel.wp);
  const batteryUsable = ev.batteryKwh * MODEL.battery.dod;
  const s = input.system;

  const limitingFactor =
    decision.panelCount >= decision.constraints.maxPanels && decision.constraints.binding !== "production"
      ? decision.constraints.binding
      : null;

  const feasibility = feasibilityDetail(feasibilityOf(ev.metrics.paybackYears, ev.metrics.npv), ev, ctx.lifetime);
  const co2Lifetime = ev.years.reduce((a, y) => a + y.co2Kg, 0);
  const co2Y1 = ev.years[0]?.co2Kg ?? 0;
  const pshAvg = input.location.ghi.reduce((a, b) => a + b, 0) / 12;

  const result: CalculationResult = {
    engineVersion: ENGINE_VERSION,
    input,
    consumption: {
      tariffId: ctx.tariff.id,
      tariffLabel: ctx.tariff.label,
      tariffCode: ctx.tariff.code,
      baseRate: ctx.baseRate,
      taxPct: ctx.taxFrac * 100,
      effectiveRate: ctx.effectiveRate,
      subsidized: ctx.tariff.subsidized,
      va: ctx.va,
      monthlyKwh: ctx.monthlyKwh,
      annualKwh,
      dailyAvgKwh: annualKwh / 365,
      profile: ctx.profile,
      daytimeSharePct: daytimeShare(ctx.profile) * 100,
      minimumMonthlyKwh: ctx.minMonthlyKwh,
      monthlyBillAvg: ev.year1.billBefore / 12,
    },
    solar: {
      source: input.location.source,
      sourceLabel: solarSourceLabel(input),
      ghiMonthly: ctx.pv.ghiDaily,
      poaMonthly: ctx.pv.poaDaily,
      pshAvg,
      specificYield: ctx.pv.annualYield,
      performanceRatio: ctx.pv.performanceRatio,
      temperatureLossPct: ctx.pv.temperatureLoss * 100,
      tiltDeg: input.roof.tiltDeg,
      azimuths: ctx.pv.azimuths,
      orientationLabel: ORIENTATION_LABELS[input.roof.orientation],
      dailyPerKwp: ctx.pv.dailyAc,
    },
    system: {
      type: ctx.type,
      panelCount: ev.panelCount,
      panelWp: ctx.panel.wp,
      panelLabel: ctx.panel.label,
      kwp,
      inverterKw: inverter.kw,
      inverterCount: inverter.count,
      inverterPhase: inverter.phase,
      dcAcRatio: kwp / (inverter.kw * inverter.count),
      batteryKwh: ev.batteryKwh,
      batteryUsableKwh: batteryUsable,
      batteryModules: ev.batteryKwh > 0 ? Math.round(ev.batteryKwh / BATTERY_MODULE_KWH) : 0,
      roofAreaM2: ev.panelCount * ctx.panel.areaM2 * ROOF_SPACING_FACTOR,
      maxPanels: decision.constraints.maxPanels,
      limitingFactor,
      sizingNote: decision.note,
      netZeroKwp,
      netZeroPanels,
      netZeroRoofM2: netZeroPanels * ctx.panel.areaM2 * ROOF_SPACING_FACTOR,
      backupHours: ev.batteryKwh > 0 ? batteryUsable / Math.max(0.05, s.backupLoadW / 1000) : null,
    },
    evaluation,
    feasibility,
    environment: {
      co2Year1Kg: co2Y1,
      co2LifetimeKg: co2Lifetime,
      treesEquivalent: co2Y1 / MODEL.treeKgCo2PerYear,
      carKmEquivalent: co2Y1 / MODEL.carKgCo2PerKm,
      emissionFactor:
        ctx.type === "off-grid" && s.offgridBaseline === "genset" ? MODEL.gensetKgCo2PerKwh : input.finance.emissionFactor,
    },
    sizing: { mode: s.sizingMode, curve: decision.curve, options: decision.options },
    warnings: buildWarnings(ctx, decision, ev, limitingFactor),
    assumptions: buildAssumptions(ctx, ev),
  };
  return result;
}

function buildWarnings(
  ctx: EngineContext,
  decision: SizingDecision,
  ev: Evaluation,
  limitingFactor: ReturnType<typeof decideSize>["constraints"]["binding"] | null,
): Warning[] {
  const w: Warning[] = [];
  const input = ctx.input;
  const y1 = ev.year1;

  if (ctx.tariff.subsidized) {
    w.push({
      code: "SUBSIDIZED_TARIFF",
      level: "warning",
      message: `Tarif Anda bersubsidi (${formatRupiah(ctx.baseRate)}/kWh), sehingga nilai penghematan PLTS kecil dan balik modal lebih lama dibanding pelanggan nonsubsidi.`,
    });
  }
  if (ctx.type !== "off-grid" && y1.production > 0) {
    const surplusPct = (y1.exported / y1.production) * 100;
    if (surplusPct >= 20) {
      w.push({
        code: "HIGH_SURPLUS",
        level: "warning",
        message:
          input.finance.exportCompensationPct > 0
            ? `${formatPercent(surplusPct)} produksi mengalir ke jaringan PLN dan hanya dihargai ${input.finance.exportCompensationPct}% dari tarif.`
            : `${formatPercent(surplusPct)} produksi tidak terpakai dan mengalir ke jaringan PLN tanpa kompensasi (Permen ESDM 2/2024). Pertimbangkan kapasitas lebih kecil, menggeser pemakaian ke siang hari, atau baterai.`,
      });
    }
  }
  if (ctx.type !== "off-grid" && y1.minimumBillMonths > 0) {
    w.push({
      code: "MINIMUM_BILL",
      level: "info",
      message: `Pada ${y1.minimumBillMonths} bulan, tagihan setelah PLTS menyentuh rekening minimum PLN (${MODEL.minimumBillHours} jam nyala ≈ ${formatNumber(ctx.minMonthlyKwh)} kWh/bulan). Menambah kapasitas tidak lagi menambah penghematan pada bulan tersebut.`,
    });
  }
  if (limitingFactor === "roof") {
    w.push({
      code: "ROOF_LIMITED",
      level: "info",
      message: `Kapasitas dibatasi luas atap: maksimal ${decision.constraints.maxPanels} panel untuk ${formatNumber(input.roof.areaM2 ?? 0)} m².`,
    });
  }
  if (limitingFactor === "connection") {
    w.push({
      code: "CONNECTION_LIMITED",
      level: "info",
      message: `Kapasitas dibatasi daya tersambung PLN (${formatNumber(ctx.va)} VA). Nonaktifkan batas ini di langkah Sistem bila PLN/installer mengizinkan kapasitas lebih besar.`,
    });
  }
  if (decision.manualExceeds === "roof") {
    w.push({
      code: "MANUAL_EXCEEDS_ROOF",
      level: "warning",
      message: `Kapasitas manual membutuhkan ±${formatNumber(ev.panelCount * ctx.panel.areaM2 * ROOF_SPACING_FACTOR)} m² atap, melebihi luas yang Anda masukkan.`,
    });
  } else if (decision.manualExceeds === "connection") {
    w.push({
      code: "MANUAL_EXCEEDS_CONNECTION",
      level: "warning",
      message: `Kapasitas manual melebihi daya tersambung PLN (${formatNumber(ctx.va)} VA); pastikan sesuai ketentuan PLN dan kuota PLTS atap.`,
    });
  }
  if (decision.targetReached === false && decision.maxAchievableFractionPct !== null) {
    const max = formatPercent(decision.maxAchievableFractionPct);
    const reason =
      decision.targetLimitedBy === "roof"
        ? "kapasitas dibatasi luas atap"
        : decision.targetLimitedBy === "connection"
          ? `kapasitas dibatasi daya tersambung PLN (${formatNumber(ctx.va)} VA)`
          : `sebagian besar pemakaian terjadi saat matahari tidak bersinar${ctx.type === "on-grid" ? " — sistem hybrid (dengan baterai) dapat meningkatkannya" : ""}`;
    w.push({
      code: "TARGET_NOT_REACHED",
      level: "warning",
      message: `Target ${input.system.targetPct}% tidak tercapai: porsi energi surya maksimum ±${max} karena ${reason}.`,
    });
  }
  if (ctx.type === "off-grid" && decision.offgridUnmetPct !== null && decision.offgridUnmetPct > 1) {
    w.push({
      code: "OFFGRID_UNMET",
      level: "danger",
      message: `Sistem off-grid ini belum memenuhi ±${formatPercent(decision.offgridUnmetPct, 1)} kebutuhan listrik; perlu sumber cadangan (genset/PLN) atau kapasitas lebih besar.`,
    });
  }
  if (ctx.type === "hybrid" && input.system.batteryMode === "backup") {
    w.push({
      code: "BACKUP_ONLY",
      level: "info",
      message: "Baterai dicadangkan untuk kondisi padam, sehingga tidak menambah penghematan harian.",
    });
  }
  if (annualConsumption(ctx) / 12 < 100) {
    w.push({
      code: "LOW_CONSUMPTION",
      level: "info",
      message: "Pemakaian listrik Anda relatif kecil; biaya tetap pemasangan membuat PLTS skala sangat kecil kurang ekonomis.",
    });
  }
  return w;
}

function buildAssumptions(ctx: EngineContext, ev: Evaluation): AssumptionItem[] {
  const i = ctx.input;
  const f = i.finance;
  const items: AssumptionItem[] = [];
  const add = (group: string, label: string, value: string) => items.push({ group, label, value });

  add("Lokasi & radiasi", "Lokasi", `${i.location.name}${i.location.province ? `, ${i.location.province}` : ""} (${formatDecimal(i.location.lat, 2)}°, ${formatDecimal(i.location.lon, 2)}°)`);
  add("Lokasi & radiasi", "Sumber data radiasi", solarSourceLabel(i));
  add("Lokasi & radiasi", "Radiasi rata-rata", `${formatDecimal(i.location.ghi.reduce((a, b) => a + b, 0) / 12, 2)} kWh/m²/hari`);
  add("Lokasi & radiasi", "Kemiringan & arah panel", `${i.roof.tiltDeg}° · ${ORIENTATION_LABELS[i.roof.orientation]}`);
  add("Lokasi & radiasi", "Bayangan", `${i.roof.shadingPct}%`);
  add("Lokasi & radiasi", "Performance ratio", formatPercent(ctx.pv.performanceRatio * 100, 1));

  add("Tarif & konsumsi", "Golongan tarif", `${ctx.tariff.label} · ${formatNumber(ctx.va)} VA`);
  add("Tarif & konsumsi", "Tarif dasar", `${formatRupiah(ctx.baseRate)}/kWh`);
  add("Tarif & konsumsi", "Pajak (PBJT + PPN)", formatPercent(ctx.taxFrac * 100, 1));
  add("Tarif & konsumsi", "Konsumsi tahunan", formatKwh(annualConsumption(ctx)));
  add("Tarif & konsumsi", "Pola pemakaian", `${getLoadProfile(i.consumption.profileId).label} (siang ${formatPercent(daytimeShare(ctx.profile) * 100)})`);
  add("Tarif & konsumsi", "Rekening minimum", `${MODEL.minimumBillHours} jam nyala (${formatNumber(ctx.minMonthlyKwh)} kWh/bulan)`);
  add("Tarif & konsumsi", "Kompensasi ekspor", f.exportCompensationPct > 0 ? `${f.exportCompensationPct}% dari tarif` : "Tidak ada (Permen ESDM 2/2024)");

  add("Sistem", "Panel", ctx.panel.label);
  add("Sistem", "Efisiensi inverter", formatPercent(MODEL.inverterEfficiency * 100, 1));
  add("Sistem", "Degradasi panel", `${formatDecimal(f.degradationFirstYearPct, 1)}% tahun pertama, ${formatDecimal(f.degradationPct, 2)}%/tahun`);
  if (ev.batteryKwh > 0) {
    add("Sistem", "Baterai", `LiFePO4, DoD ${formatPercent(MODEL.battery.dod * 100)}, efisiensi ${formatPercent(MODEL.battery.roundTripEfficiency * 100)}, umur ${f.batteryLifeYears} tahun`);
  }

  add("Biaya", "Kelas komponen", PRICE_TIERS[f.priceTier].label);
  add("Biaya", "Harga sistem", `${formatRupiah(ev.pricePerKwp)}/kWp${f.pricePerKwpOverride ? " (input Anda)" : ""}`);
  if (ev.batteryKwh > 0) add("Biaya", "Harga baterai", `${formatRupiah(f.batteryPricePerKwh)}/kWh`);
  add("Biaya", "O&M", `${formatDecimal(f.omPct, 1)}% investasi/tahun (naik ${formatDecimal(f.inflationPct, 1)}%/tahun)`);
  add("Biaya", "Penggantian inverter", `Tiap ${f.inverterLifeYears} tahun (${f.inverterReplacementPct}% biaya sistem PV)`);

  add("Finansial", "Kenaikan tarif PLN", `${formatDecimal(f.tariffEscalationPct, 1)}%/tahun`);
  add("Finansial", "Tingkat diskonto", `${formatDecimal(f.discountRatePct, 1)}%/tahun`);
  add("Finansial", "Umur analisis", `${f.lifetimeYears} tahun`);
  if (f.paymentMode === "loan") {
    add("Finansial", "Pembiayaan", `DP ${f.downPaymentPct}%, bunga ${formatDecimal(f.loanRatePct, 1)}%/tahun, tenor ${f.loanTenorYears} tahun`);
  }
  add("Lingkungan", "Faktor emisi grid", `${formatDecimal(f.emissionFactor, 2)} kg CO₂/kWh`);
  return items;
}

// ---------------------------------------------------------------------------
// Perbandingan sistem & sensitivitas
// ---------------------------------------------------------------------------

/** Di atas pemakaian ini sistem off-grid dianggap tidak praktis untuk dibandingkan. */
const OFFGRID_MAX_MONTHLY_KWH = 20_000;

const PROS_CONS: Record<SystemType, { pros: string[]; cons: string[] }> = {
  "on-grid": {
    pros: ["Investasi paling rendah", "Tanpa baterai, perawatan mudah", "Balik modal umumnya tercepat"],
    cons: ["Ikut padam saat listrik PLN padam", "Surplus siang tidak dikompensasi"],
  },
  hybrid: {
    pros: ["Surplus siang disimpan untuk malam", "Listrik cadangan saat PLN padam", "Porsi energi hijau lebih tinggi"],
    cons: ["Biaya baterai tinggi", "Baterai perlu diganti ±10 tahun"],
  },
  "off-grid": {
    pros: ["Mandiri tanpa PLN", "Cocok untuk lokasi terpencil"],
    cons: ["Investasi terbesar (baterai besar)", "Perlu cadangan saat mendung berhari-hari"],
  },
};

export function calculateComparison(input: CalculatorInput, current: CalculationResult, pv?: PvProfile): ComparisonItem[] {
  const pvProfile = pv ?? buildPvProfile(input);
  const types: SystemType[] = ["on-grid", "hybrid", "off-grid"];
  const monthlyKwh = current.consumption.annualKwh / 12;
  return types.map((type) => {
    if (type === "off-grid" && type !== input.system.type && monthlyKwh > OFFGRID_MAX_MONTHLY_KWH) {
      return {
        type,
        label: SYSTEM_LABELS[type],
        applicable: false,
        note: "Tidak praktis untuk skala pemakaian ini (baterai terlalu besar).",
        kwp: 0,
        batteryKwh: 0,
        capex: 0,
        monthlySavings: 0,
        paybackYears: null,
        npv: 0,
        solarFractionPct: 0,
        feasibility: "tidak-layak" as FeasibilityLevel,
        pros: PROS_CONS[type].pros,
        cons: PROS_CONS[type].cons,
      };
    }
    let r: CalculationResult;
    if (type === input.system.type) {
      r = current;
    } else {
      const variant: CalculatorInput = {
        ...input,
        system: {
          ...input.system,
          type,
          sizingMode: "optimal",
          batteryMode: input.system.batteryMode === "backup" ? "surplus" : input.system.batteryMode,
        },
      };
      r = calculate(variant, { pvProfile });
    }
    const ev = r.evaluation;
    return {
      type,
      label: SYSTEM_LABELS[type],
      applicable: true,
      note: null,
      kwp: ev.kwp,
      batteryKwh: ev.batteryKwh,
      capex: ev.capex,
      monthlySavings: ev.year1.savings / 12,
      paybackYears: ev.metrics.paybackYears,
      npv: ev.metrics.npv,
      solarFractionPct: ev.year1.solarFractionPct,
      feasibility: r.feasibility.level,
      pros: PROS_CONS[type].pros,
      cons: PROS_CONS[type].cons,
    };
  });
}

export function calculateSensitivity(input: CalculatorInput, current: CalculationResult, pv?: PvProfile): SensitivityItem[] {
  const pvProfile = pv ?? buildPvProfile(input);
  const ev = current.evaluation;
  const cfg = {
    panelCount: ev.panelCount,
    batteryKwh: ev.batteryKwh,
    batteryReserveKwh:
      input.system.type === "hybrid" && input.system.batteryMode === "backup"
        ? (input.system.backupHours * input.system.backupLoadW) / 1000
        : 0,
  };
  const run = (overrides: Parameters<typeof buildContext>[1]) => {
    const e = evaluateSystem(buildContext(input, { pvProfile, ...overrides }), cfg);
    return { paybackYears: e.metrics.paybackYears, npv: e.metrics.npv };
  };
  const esc = input.finance.tariffEscalationPct;
  const share = Math.round(current.consumption.daytimeSharePct);
  return [
    {
      id: "capex",
      label: "Harga sistem",
      lowLabel: "−20%",
      highLabel: "+20%",
      low: run({ capexScale: 0.8 }),
      high: run({ capexScale: 1.2 }),
    },
    {
      id: "escalation",
      label: "Kenaikan tarif PLN",
      lowLabel: "0%/thn",
      highLabel: `${formatDecimal(esc + 3, 1)}%/thn`,
      low: run({ escalationPct: 0 }),
      high: run({ escalationPct: esc + 3 }),
    },
    {
      id: "irradiance",
      label: "Radiasi matahari",
      lowLabel: "−10%",
      highLabel: "+10%",
      low: run({ pvScale: 0.9 }),
      high: run({ pvScale: 1.1 }),
    },
    {
      id: "daytime",
      label: "Porsi pemakaian siang",
      lowLabel: `${Math.max(5, share - 10)}%`,
      highLabel: `${Math.min(95, share + 10)}%`,
      low: run({ daytimeShareDelta: -0.1 }),
      high: run({ daytimeShareDelta: 0.1 }),
    },
  ];
}

export function calculateExtras(input: CalculatorInput, current: CalculationResult): CalculationExtras {
  const pv = buildPvProfile(input);
  return {
    comparison: calculateComparison(input, current, pv),
    sensitivity: calculateSensitivity(input, current, pv),
  };
}

/** Ringkasan singkat untuk metadata, daftar riwayat, dan API. */
export function summarize(result: CalculationResult) {
  const ev = result.evaluation;
  return {
    engineVersion: result.engineVersion,
    systemType: result.system.type,
    kwp: Math.round(result.system.kwp * 100) / 100,
    panelCount: result.system.panelCount,
    batteryKwh: Math.round(result.system.batteryKwh * 100) / 100,
    capex: Math.round(ev.capex),
    monthlySavings: Math.round(ev.year1.savings / 12),
    paybackYears: ev.metrics.paybackYears === null ? null : Math.round(ev.metrics.paybackYears * 10) / 10,
    roiPct: Math.round(ev.metrics.roiPct),
    npv: Math.round(ev.metrics.npv),
    solarFractionPct: Math.round(ev.year1.solarFractionPct),
    co2Year1Kg: Math.round(result.environment.co2Year1Kg),
    feasibility: result.feasibility.level,
    locationName: result.input.location.name,
  };
}

export type CalculationSummary = ReturnType<typeof summarize>;

export { panelKwp };
