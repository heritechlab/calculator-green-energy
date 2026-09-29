import { basePricePerKwp, CAPEX_SHARES, PRICE_TIERS, SYSTEM_PREMIUM_PER_KWP } from "@/lib/data/prices";
import { DAYS_IN_MONTH, MODEL } from "./constants";
import type { EngineContext } from "./context";
import { annuityPayment, discountedCashflows, irr, npv, paybackPeriod } from "./finance";
import type { CapexItem, DayResult, Evaluation, HourlyDetail, LoanSummary, MonthlyEnergy, YearRecord } from "./types";

export interface BatteryConfig {
  /** Kapasitas nominal (kWh). */
  capacityKwh: number;
  /** Energi usable yang dicadangkan untuk kondisi padam (kWh). */
  reserveKwh: number;
}

interface BatteryRuntime {
  capacity: number;
  socMin: number;
  socFloor: number;
  etaC: number;
  etaD: number;
  pMax: number;
}

// ---------------------------------------------------------------------------
// Biaya
// ---------------------------------------------------------------------------

export function pricePerKwp(ctx: EngineContext, kwp: number): number {
  const f = ctx.input.finance;
  if (f.pricePerKwpOverride) return f.pricePerKwpOverride;
  return basePricePerKwp(kwp) * PRICE_TIERS[f.priceTier].multiplier + SYSTEM_PREMIUM_PER_KWP[ctx.type];
}

export function capexFor(
  ctx: EngineContext,
  kwp: number,
  batteryKwh: number,
): { capex: number; pvCapex: number; batteryCapex: number; unitPrice: number; items: CapexItem[] } {
  const f = ctx.input.finance;
  const unitPrice = pricePerKwp(ctx, kwp);
  const pvCapex = kwp * unitPrice * ctx.capexScale;
  const batteryCapex = batteryKwh * f.batteryPricePerKwh * ctx.capexScale;
  const extra = f.extraCost * ctx.capexScale;

  const premium = f.pricePerKwpOverride ? 0 : SYSTEM_PREMIUM_PER_KWP[ctx.type] * kwp * ctx.capexScale;
  const basePart = pvCapex - premium;
  const items: CapexItem[] = CAPEX_SHARES.map((s) => ({
    key: s.key,
    label: s.key === "inverter" && ctx.type !== "on-grid" ? `Inverter ${ctx.type === "hybrid" ? "hybrid" : "off-grid"}` : s.label,
    amount: basePart * s.share + (s.key === "inverter" ? premium : 0),
  }));
  if (batteryCapex > 0) items.push({ key: "battery", label: "Baterai LiFePO4", amount: batteryCapex });
  if (extra > 0) items.push({ key: "extra", label: "Biaya tambahan", amount: extra });

  return { capex: pvCapex + batteryCapex + extra, pvCapex, batteryCapex, unitPrice, items };
}

// ---------------------------------------------------------------------------
// Simulasi harian
// ---------------------------------------------------------------------------

function batteryRuntime(config: BatteryConfig | null, capacityFactor: number): BatteryRuntime | null {
  if (!config || config.capacityKwh <= 0) return null;
  const b = MODEL.battery;
  const capacity = config.capacityKwh * capacityFactor;
  const socMin = capacity * (1 - b.dod);
  const eta = Math.sqrt(b.roundTripEfficiency);
  return {
    capacity,
    socMin,
    socFloor: Math.min(capacity, socMin + Math.max(0, config.reserveKwh)),
    etaC: eta,
    etaD: eta,
    pMax: config.capacityKwh * b.cRate,
  };
}

function runDay(
  pv: number[],
  load: number[],
  batt: BatteryRuntime | null,
  startSoc: number,
  offgrid: boolean,
  detail: HourlyDetail | null,
): { result: DayResult; soc: number } {
  const r: DayResult = { direct: 0, charge: 0, discharge: 0, gridImport: 0, exported: 0, unmet: 0 };
  let soc = startSoc;
  for (let h = 0; h < 24; h++) {
    const p = pv[h];
    const l = load[h];
    const direct = p < l ? p : l;
    let surplus = p - direct;
    let deficit = l - direct;
    let charge = 0;
    let discharge = 0;
    if (batt) {
      if (surplus > 0) {
        const room = (batt.capacity - soc) / batt.etaC;
        charge = Math.max(0, Math.min(surplus, room, batt.pMax));
        soc += charge * batt.etaC;
        surplus -= charge;
      }
      if (deficit > 0) {
        const available = (soc - batt.socFloor) * batt.etaD;
        discharge = Math.max(0, Math.min(deficit, available, batt.pMax));
        soc -= discharge / batt.etaD;
        deficit -= discharge;
      }
    }
    r.direct += direct;
    r.charge += charge;
    r.discharge += discharge;
    r.exported += surplus;
    if (offgrid) r.unmet += deficit;
    else r.gridImport += deficit;
    if (detail) {
      detail.pv[h] = p;
      detail.load[h] = l;
      detail.direct[h] = direct;
      detail.charge[h] = charge;
      detail.discharge[h] = discharge;
      detail.exported[h] = surplus;
      detail.gridImport[h] = offgrid ? 0 : deficit;
      detail.unmet[h] = offgrid ? deficit : 0;
      detail.soc[h] = batt ? soc / batt.capacity : 0;
    }
  }
  return { result: r, soc };
}

function emptyDetail(): HourlyDetail {
  const z = () => new Array<number>(24).fill(0);
  return { pv: z(), load: z(), direct: z(), charge: z(), discharge: z(), gridImport: z(), exported: z(), unmet: z(), soc: z() };
}

const MAX_WARMUP_DAYS = 6;

/**
 * Simulasi hari representatif. Dengan baterai, simulasi dimulai dari kondisi kosong
 * (batas bawah) lalu diulang hingga SOC awal ≈ SOC akhir (kondisi tunak). Karena
 * urutan SOC dari kondisi kosong naik monoton, hasilnya tidak pernah "meminjam"
 * energi dari muatan awal — estimasi konservatif.
 */
export function simulateDay(
  pv: number[],
  load: number[],
  batt: BatteryRuntime | null,
  offgrid: boolean,
  detail: HourlyDetail | null = null,
): DayResult {
  if (!batt) return runDay(pv, load, null, 0, offgrid, detail).result;
  let soc = batt.socFloor;
  const tolerance = 1e-3 * batt.capacity;
  for (let i = 0; i < MAX_WARMUP_DAYS; i++) {
    const next = runDay(pv, load, batt, soc, offgrid, null).soc;
    const converged = Math.abs(next - soc) < tolerance;
    soc = next;
    if (converged) break;
  }
  return runDay(pv, load, batt, soc, offgrid, detail).result;
}

// ---------------------------------------------------------------------------
// Simulasi tahunan
// ---------------------------------------------------------------------------

export interface YearEnergy {
  months: {
    production: number;
    consumption: number;
    direct: number;
    fromBattery: number;
    gridImport: number;
    exported: number;
    unmet: number;
  }[];
  daily: HourlyDetail[] | null;
}

export function degradationFactor(ctx: EngineContext, year: number): number {
  const f = ctx.input.finance;
  return (1 - f.degradationFirstYearPct / 100) * Math.pow(1 - f.degradationPct / 100, year - 1);
}

export function simulateYearEnergy(
  ctx: EngineContext,
  kwp: number,
  battery: BatteryConfig | null,
  year: number,
  batteryAgeYears: number,
  withDetail: boolean,
): YearEnergy {
  const offgrid = ctx.type === "off-grid";
  const pvFactor = kwp * degradationFactor(ctx, year);
  const growth = Math.pow(1 + ctx.input.consumption.growthPct / 100, year - 1);
  const capFactor = Math.max(0.6, 1 - MODEL.battery.fadePerYear * batteryAgeYears);
  const batt = batteryRuntime(battery, capFactor);
  const months: YearEnergy["months"] = [];
  const daily: HourlyDetail[] | null = withDetail ? [] : null;
  const pvRow = new Array<number>(24);
  const loadRow = new Array<number>(24);

  for (let m = 0; m < 12; m++) {
    const pvm = ctx.pv.hourly[m];
    const dl = ctx.dailyLoad[m] * growth;
    for (let h = 0; h < 24; h++) {
      pvRow[h] = pvm[h] * pvFactor;
      loadRow[h] = dl * ctx.profile[h];
    }
    const detail = withDetail ? emptyDetail() : null;
    const day = simulateDay(pvRow, loadRow, batt, offgrid, detail);
    const days = DAYS_IN_MONTH[m];
    months.push({
      production: ctx.pv.dailyAc[m] * pvFactor * days,
      consumption: dl * days,
      direct: day.direct * days,
      fromBattery: day.discharge * days,
      gridImport: day.gridImport * days,
      exported: day.exported * days,
      unmet: day.unmet * days,
    });
    if (daily && detail) daily.push(detail);
  }
  return { months, daily };
}

// ---------------------------------------------------------------------------
// Evaluasi finansial seumur sistem
// ---------------------------------------------------------------------------

export interface EvaluateOptions {
  panelCount: number;
  batteryKwh: number;
  batteryReserveKwh?: number;
  detail?: boolean;
}

export function evaluateSystem(ctx: EngineContext, opts: EvaluateOptions): Evaluation {
  const f = ctx.input.finance;
  const kwp = (opts.panelCount * ctx.panel.wp) / 1000;
  const batteryKwh = ctx.type === "on-grid" ? 0 : opts.batteryKwh;
  const battery: BatteryConfig | null =
    batteryKwh > 0 ? { capacityKwh: batteryKwh, reserveKwh: opts.batteryReserveKwh ?? 0 } : null;
  const cost = capexFor(ctx, kwp, batteryKwh);
  const offgrid = ctx.type === "off-grid";
  const exportComp = offgrid ? 0 : f.exportCompensationPct / 100;
  const beforePostpaid = ctx.input.consumption.meterType === "postpaid";
  const ef = offgrid && ctx.input.system.offgridBaseline === "genset" ? MODEL.gensetKgCo2PerKwh : f.emissionFactor;

  const years: YearRecord[] = [];
  const cashflows: number[] = [-cost.capex];
  let cumulative = -cost.capex;
  let discountedCumulative = -cost.capex;
  let lastBatteryInstall = 0;
  let monthly: MonthlyEnergy[] | undefined;
  let daily: HourlyDetail[] | undefined;
  let lcoeCostPv = cost.capex;
  let lcoeEnergyProduced = 0;
  let lcoeEnergyUsed = 0;
  let minBillMonthsY1 = 0;

  // Pembiayaan
  const loanActive = f.paymentMode === "loan";
  const downPayment = loanActive ? cost.capex * (f.downPaymentPct / 100) : cost.capex;
  const principal = loanActive ? cost.capex - downPayment : 0;
  const installment = loanActive ? annuityPayment(principal, f.loanRatePct / 100, f.loanTenorYears * 12) : 0;
  let cumulativeWithLoan = -downPayment;
  const loanCashflows: number[] = [-downPayment];

  for (let y = 1; y <= ctx.lifetime; y++) {
    const energy = simulateYearEnergy(ctx, kwp, battery, y, y - 1 - lastBatteryInstall, opts.detail === true && y === 1);
    const rate = ctx.baseRate * Math.pow(1 + ctx.escalation, y - 1);
    const inflationFactor = Math.pow(1 + ctx.inflation, y - 1);
    const pricePerKwh = rate * (1 + ctx.taxFrac);
    const gensetRate = ctx.input.system.gensetCostPerKwh * inflationFactor;
    const baselineRate = offgrid && ctx.input.system.offgridBaseline === "genset" ? gensetRate : pricePerKwh;

    let production = 0;
    let consumption = 0;
    let used = 0;
    let exported = 0;
    let gridImport = 0;
    let unmet = 0;
    let billBefore = 0;
    let billAfter = 0;
    let minBillMonths = 0;
    const monthRecords: MonthlyEnergy[] = [];

    energy.months.forEach((mo, m) => {
      let before: number;
      let after: number;
      let minApplied = false;
      if (offgrid) {
        const baseKwh =
          ctx.input.system.offgridBaseline === "pln" && beforePostpaid
            ? Math.max(mo.consumption, ctx.minMonthlyKwh)
            : mo.consumption;
        before = baseKwh * baselineRate;
        after = mo.unmet * baselineRate;
      } else {
        const beforeKwh = beforePostpaid ? Math.max(mo.consumption, ctx.minMonthlyKwh) : mo.consumption;
        before = beforeKwh * pricePerKwh;
        const netKwh = mo.gridImport - mo.exported * exportComp;
        minApplied = netKwh < ctx.minMonthlyKwh;
        after = Math.max(netKwh, ctx.minMonthlyKwh) * pricePerKwh;
      }
      if (minApplied) minBillMonths++;
      production += mo.production;
      consumption += mo.consumption;
      used += mo.direct + mo.fromBattery;
      exported += mo.exported;
      gridImport += mo.gridImport;
      unmet += mo.unmet;
      billBefore += before;
      billAfter += after;
      if (y === 1 && opts.detail) {
        monthRecords.push({
          month: m,
          production: mo.production,
          consumption: mo.consumption,
          direct: mo.direct,
          fromBattery: mo.fromBattery,
          gridImport: mo.gridImport,
          exported: mo.exported,
          unmet: mo.unmet,
          billBefore: before,
          billAfter: after,
          savings: before - after,
          minimumBillApplied: minApplied,
        });
      }
    });

    const savings = billBefore - billAfter;
    const om = (f.omPct / 100) * cost.capex * inflationFactor;
    let replacement = 0;
    const replacementItems: string[] = [];
    const allowReplacement = y <= ctx.lifetime - MODEL.noReplacementFinalYears;
    if (allowReplacement && y % f.inverterLifeYears === 0) {
      replacement += (f.inverterReplacementPct / 100) * cost.pvCapex;
      replacementItems.push("Inverter");
    }
    if (battery && allowReplacement && y - lastBatteryInstall >= f.batteryLifeYears) {
      replacement += MODEL.battery.replacementCostFactor * cost.batteryCapex;
      replacementItems.push("Baterai");
      lastBatteryInstall = y;
    }

    const cashflow = savings - om - replacement;
    cashflows.push(cashflow);
    cumulative += cashflow;
    const discountedCashflow = cashflow / Math.pow(1 + ctx.discount, y);
    discountedCumulative += discountedCashflow;

    const loanPayment = loanActive && y <= f.loanTenorYears ? installment * 12 : 0;
    const cashflowWithLoan = cashflow - loanPayment;
    cumulativeWithLoan += cashflowWithLoan;
    loanCashflows.push(cashflowWithLoan);

    const disc = Math.pow(1 + ctx.discount, y);
    lcoeCostPv += (om + replacement) / disc;
    lcoeEnergyProduced += production / disc;
    lcoeEnergyUsed += used / disc;

    years.push({
      year: y,
      production,
      consumption,
      used,
      exported,
      gridImport,
      unmet,
      billBefore,
      billAfter,
      savings,
      om,
      replacement,
      replacementItems,
      cashflow,
      cumulative,
      discountedCashflow,
      discountedCumulative,
      loanPayment,
      cashflowWithLoan,
      cumulativeWithLoan,
      co2Kg: used * ef,
    });

    if (y === 1) {
      minBillMonthsY1 = minBillMonths;
      if (opts.detail) {
        monthly = monthRecords;
        daily = energy.daily ?? undefined;
      }
    }
  }

  const y1 = years[0];
  const totalSavings = years.reduce((a, r) => a + r.savings, 0);
  const totalNet = years.reduce((a, r) => a + r.cashflow, 0);
  const discounted = discountedCashflows(ctx.discount, cashflows);

  let loan: LoanSummary | null = null;
  if (loanActive) {
    const monthlySavingsY1 = y1.savings / 12;
    loan = {
      principal,
      downPayment,
      monthlyInstallment: installment,
      totalInterest: installment * f.loanTenorYears * 12 - principal,
      totalPaid: installment * f.loanTenorYears * 12,
      tenorYears: f.loanTenorYears,
      ratePct: f.loanRatePct,
      monthlyNetYear1: monthlySavingsY1 - installment,
      paybackYearsOnEquity: paybackPeriod(loanCashflows),
      netBenefit: loanCashflows.reduce((a, b) => a + b, 0),
    };
  }

  const fromBatteryY1 = monthly ? monthly.reduce((a, m) => a + m.fromBattery, 0) : 0;
  const directY1 = monthly ? monthly.reduce((a, m) => a + m.direct, 0) : y1.used;

  return {
    panelCount: opts.panelCount,
    kwp,
    batteryKwh,
    capex: cost.capex,
    capexItems: cost.items,
    pricePerKwp: cost.unitPrice * ctx.capexScale,
    pvCapex: cost.pvCapex,
    batteryCapex: cost.batteryCapex,
    years,
    metrics: {
      capex: cost.capex,
      paybackYears: paybackPeriod(cashflows),
      discountedPaybackYears: paybackPeriod(discounted),
      npv: npv(ctx.discount, cashflows),
      irr: irr(cashflows),
      roiPct: cost.capex > 0 ? ((totalNet - cost.capex) / cost.capex) * 100 : 0,
      lcoeProduced: lcoeEnergyProduced > 0 ? lcoeCostPv / lcoeEnergyProduced : 0,
      lcoeUsed: lcoeEnergyUsed > 0 ? lcoeCostPv / lcoeEnergyUsed : 0,
      totalSavings,
      totalNetCashflow: totalNet,
    },
    loan,
    year1: {
      production: y1.production,
      consumption: y1.consumption,
      direct: directY1,
      fromBattery: fromBatteryY1,
      used: y1.used,
      gridImport: y1.gridImport,
      exported: y1.exported,
      unmet: y1.unmet,
      billBefore: y1.billBefore,
      billAfter: y1.billAfter,
      savings: y1.savings,
      selfConsumptionPct: y1.production > 0 ? (y1.used / y1.production) * 100 : 0,
      solarFractionPct: y1.consumption > 0 ? (y1.used / y1.consumption) * 100 : 0,
      minimumBillMonths: minBillMonthsY1,
    },
    monthly,
    daily,
  };
}

/** Simulasi cepat tahun pertama (untuk sizing target/off-grid & baterai). */
export function yearOneEnergy(ctx: EngineContext, kwp: number, battery: BatteryConfig | null) {
  const e = simulateYearEnergy(ctx, kwp, battery, 1, 0, false);
  const sum = (key: keyof YearEnergy["months"][number]) => e.months.reduce((a, m) => a + m[key], 0);
  const production = sum("production");
  const consumption = sum("consumption");
  const used = sum("direct") + sum("fromBattery");
  const unmet = sum("unmet");
  const worstMonthUnmetFrac = Math.max(...e.months.map((m) => (m.consumption > 0 ? m.unmet / m.consumption : 0)));
  return {
    production,
    consumption,
    used,
    unmet,
    exported: sum("exported"),
    solarFraction: consumption > 0 ? used / consumption : 0,
    selfConsumption: production > 0 ? used / production : 0,
    worstMonthUnmetFrac,
  };
}
