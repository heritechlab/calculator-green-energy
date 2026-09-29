import { CUSTOM_TARIFF_ID, getTariff } from "@/lib/data/tariffs";
import { getPanel, type PanelSpec } from "@/lib/data/panels";
import { resolveProfile, shiftDaytimeShare, daytimeShare } from "@/lib/data/load-profiles";
import { DAYS_IN_MONTH, MODEL, lossFactor } from "./constants";
import type { CalculatorInput, SystemType } from "./input";
import { computePvProfile, scalePvProfile, type PvProfile } from "./solar";

export interface TariffInfo {
  id: string;
  code: string;
  label: string;
  rate: number;
  vat: number;
  subsidized: boolean;
}

export interface EngineContext {
  input: CalculatorInput;
  type: SystemType;
  tariff: TariffInfo;
  va: number;
  /** PBJT + PPN (fraksi). */
  taxFrac: number;
  baseRate: number;
  effectiveRate: number;
  monthlyKwh: number[];
  dailyLoad: number[];
  profile: number[];
  minMonthlyKwh: number;
  panel: PanelSpec;
  pv: PvProfile;
  capexScale: number;
  escalation: number;
  inflation: number;
  discount: number;
  lifetime: number;
}

export interface ContextOverrides {
  type?: SystemType;
  pvScale?: number;
  capexScale?: number;
  escalationPct?: number;
  daytimeShareDelta?: number;
  pvProfile?: PvProfile;
}

export function resolveTariff(input: CalculatorInput): TariffInfo {
  const c = input.consumption;
  if (c.tariffId === CUSTOM_TARIFF_ID) {
    return {
      id: CUSTOM_TARIFF_ID,
      code: "Kustom",
      label: "Tarif kustom",
      rate: c.customRate ?? 1444.7,
      vat: 0,
      subsidized: false,
    };
  }
  const t = getTariff(c.tariffId) ?? getTariff("R1-2200")!;
  return { id: t.id, code: t.code, label: t.label, rate: t.rate, vat: t.vat, subsidized: t.subsidized };
}

export function buildPvProfile(input: CalculatorInput): PvProfile {
  const panel = getPanel(input.system.panelId);
  return computePvProfile({
    lat: input.location.lat,
    lon: input.location.lon,
    utcOffset: input.location.utcOffset,
    ghi: input.location.ghi,
    temp: input.location.temp,
    tiltDeg: input.roof.tiltDeg,
    orientation: input.roof.orientation,
    tempCoeff: panel.tempCoeff,
    lossFactor: lossFactor(input.roof.shadingPct),
  });
}

export function buildContext(input: CalculatorInput, overrides: ContextOverrides = {}): EngineContext {
  const c = input.consumption;
  const f = input.finance;
  const tariff = resolveTariff(input);
  const taxFrac = c.pbjtPct / 100 + tariff.vat;
  const effectiveRate = tariff.rate * (1 + taxFrac);

  let monthlyKwh: number[];
  if (c.inputMode === "monthly" && c.monthlyKwhSeries && c.monthlyKwhSeries.some((v) => v > 0)) {
    const series = c.monthlyKwhSeries;
    const positive = series.filter((v) => v > 0);
    const fill = positive.reduce((a, b) => a + b, 0) / positive.length;
    monthlyKwh = series.map((v) => (v > 0 ? v : fill));
  } else if (c.inputMode === "kwh") {
    monthlyKwh = new Array(12).fill(c.monthlyKwh);
  } else {
    monthlyKwh = new Array(12).fill(c.monthlyBill / effectiveRate);
  }
  const dailyLoad = monthlyKwh.map((kwh, m) => kwh / DAYS_IN_MONTH[m]);

  let profile = resolveProfile(c.profileId, c.daytimeSharePct);
  if (overrides.daytimeShareDelta) {
    profile = shiftDaytimeShare(profile, daytimeShare(profile) + overrides.daytimeShareDelta);
  }

  let pv = overrides.pvProfile ?? buildPvProfile(input);
  if (overrides.pvScale && overrides.pvScale !== 1) pv = scalePvProfile(pv, overrides.pvScale);

  return {
    input,
    type: overrides.type ?? input.system.type,
    tariff,
    va: c.va,
    taxFrac,
    baseRate: tariff.rate,
    effectiveRate,
    monthlyKwh,
    dailyLoad,
    profile,
    minMonthlyKwh: (MODEL.minimumBillHours * c.va) / 1000,
    panel: getPanel(input.system.panelId),
    pv,
    capexScale: overrides.capexScale ?? 1,
    escalation: (overrides.escalationPct ?? f.tariffEscalationPct) / 100,
    inflation: f.inflationPct / 100,
    discount: f.discountRatePct / 100,
    lifetime: f.lifetimeYears,
  };
}

export function annualConsumption(ctx: EngineContext): number {
  return ctx.monthlyKwh.reduce((a, b) => a + b, 0);
}
