import type { CalculatorInput, SystemType } from "./input";
import type { PvProfile } from "./solar";

export type FeasibilityLevel = "sangat-layak" | "layak" | "kurang-layak" | "tidak-layak";
export type LimitingFactor = "roof" | "connection" | "production" | null;

export interface DayResult {
  /** kWh/hari */
  direct: number;
  charge: number;
  discharge: number;
  gridImport: number;
  exported: number;
  unmet: number;
}

export interface HourlyDetail {
  pv: number[];
  load: number[];
  direct: number[];
  charge: number[];
  discharge: number[];
  gridImport: number[];
  exported: number[];
  unmet: number[];
  /** Status muatan baterai di akhir jam (fraksi 0–1 kapasitas nominal). */
  soc: number[];
}

export interface MonthlyEnergy {
  month: number;
  production: number;
  consumption: number;
  direct: number;
  fromBattery: number;
  gridImport: number;
  exported: number;
  unmet: number;
  billBefore: number;
  billAfter: number;
  savings: number;
  minimumBillApplied: boolean;
}

export interface YearRecord {
  year: number;
  production: number;
  consumption: number;
  used: number;
  exported: number;
  gridImport: number;
  unmet: number;
  billBefore: number;
  billAfter: number;
  savings: number;
  om: number;
  replacement: number;
  replacementItems: string[];
  cashflow: number;
  cumulative: number;
  discountedCashflow: number;
  discountedCumulative: number;
  loanPayment: number;
  cashflowWithLoan: number;
  cumulativeWithLoan: number;
  co2Kg: number;
}

export interface CapexItem {
  key: string;
  label: string;
  amount: number;
}

export interface LoanSummary {
  principal: number;
  downPayment: number;
  monthlyInstallment: number;
  totalInterest: number;
  totalPaid: number;
  tenorYears: number;
  ratePct: number;
  /** Hemat bulanan tahun-1 dikurangi cicilan. */
  monthlyNetYear1: number;
  paybackYearsOnEquity: number | null;
  netBenefit: number;
}

export interface FinancialMetrics {
  capex: number;
  paybackYears: number | null;
  discountedPaybackYears: number | null;
  npv: number;
  irr: number | null;
  roiPct: number;
  /** LCOE atas seluruh produksi (Rp/kWh). */
  lcoeProduced: number;
  /** Biaya per kWh listrik surya yang benar-benar terpakai (Rp/kWh). */
  lcoeUsed: number;
  totalSavings: number;
  totalNetCashflow: number;
}

export interface Evaluation {
  panelCount: number;
  kwp: number;
  batteryKwh: number;
  capex: number;
  capexItems: CapexItem[];
  pricePerKwp: number;
  pvCapex: number;
  batteryCapex: number;
  years: YearRecord[];
  metrics: FinancialMetrics;
  loan: LoanSummary | null;
  year1: {
    production: number;
    consumption: number;
    direct: number;
    fromBattery: number;
    used: number;
    gridImport: number;
    exported: number;
    unmet: number;
    billBefore: number;
    billAfter: number;
    savings: number;
    selfConsumptionPct: number;
    solarFractionPct: number;
    minimumBillMonths: number;
  };
  monthly?: MonthlyEnergy[];
  daily?: HourlyDetail[];
}

export interface SizingPoint {
  panelCount: number;
  kwp: number;
  batteryKwh: number;
  capex: number;
  annualSavings: number;
  paybackYears: number | null;
  npv: number;
  solarFractionPct: number;
  selfConsumptionPct: number;
}

export interface SizingOption {
  id: "recommended" | "best-npv" | "fastest" | "coverage";
  label: string;
  description: string;
  point: SizingPoint;
}

export interface Warning {
  code: string;
  level: "info" | "warning" | "danger";
  message: string;
}

export interface AssumptionItem {
  group: string;
  label: string;
  value: string;
}

export interface SystemSpec {
  type: SystemType;
  panelCount: number;
  panelWp: number;
  panelLabel: string;
  kwp: number;
  inverterKw: number;
  inverterCount: number;
  inverterPhase: "1 fase" | "3 fase";
  dcAcRatio: number;
  batteryKwh: number;
  batteryUsableKwh: number;
  batteryModules: number;
  roofAreaM2: number;
  maxPanels: number;
  limitingFactor: LimitingFactor;
  sizingNote: string;
  /** Kapasitas untuk menyamai 100% konsumsi tahunan (net-zero energi). */
  netZeroKwp: number;
  netZeroPanels: number;
  netZeroRoofM2: number;
  backupHours: number | null;
}

export interface ConsumptionSummary {
  tariffId: string;
  tariffLabel: string;
  tariffCode: string;
  baseRate: number;
  taxPct: number;
  effectiveRate: number;
  subsidized: boolean;
  va: number;
  monthlyKwh: number[];
  annualKwh: number;
  dailyAvgKwh: number;
  profile: number[];
  daytimeSharePct: number;
  minimumMonthlyKwh: number;
  monthlyBillAvg: number;
}

export interface SolarSummary {
  sourceLabel: string;
  source: CalculatorInput["location"]["source"];
  ghiMonthly: number[];
  poaMonthly: number[];
  pshAvg: number;
  specificYield: number;
  performanceRatio: number;
  temperatureLossPct: number;
  tiltDeg: number;
  azimuths: number[];
  orientationLabel: string;
  dailyPerKwp: number[];
}

export interface EnvironmentSummary {
  co2Year1Kg: number;
  co2LifetimeKg: number;
  treesEquivalent: number;
  carKmEquivalent: number;
  emissionFactor: number;
}

export interface Feasibility {
  level: FeasibilityLevel;
  label: string;
  summary: string;
}

export interface SensitivityItem {
  id: string;
  label: string;
  lowLabel: string;
  highLabel: string;
  low: { paybackYears: number | null; npv: number };
  high: { paybackYears: number | null; npv: number };
}

export interface ComparisonItem {
  type: SystemType;
  label: string;
  applicable: boolean;
  note: string | null;
  kwp: number;
  batteryKwh: number;
  capex: number;
  monthlySavings: number;
  paybackYears: number | null;
  npv: number;
  solarFractionPct: number;
  feasibility: FeasibilityLevel;
  pros: string[];
  cons: string[];
}

export interface CalculationResult {
  engineVersion: string;
  input: CalculatorInput;
  consumption: ConsumptionSummary;
  solar: SolarSummary;
  system: SystemSpec;
  evaluation: Evaluation & { monthly: MonthlyEnergy[]; daily: HourlyDetail[] };
  feasibility: Feasibility;
  environment: EnvironmentSummary;
  sizing: { mode: CalculatorInput["system"]["sizingMode"]; curve: SizingPoint[]; options: SizingOption[] };
  warnings: Warning[];
  assumptions: AssumptionItem[];
}

export interface CalculationExtras {
  comparison: ComparisonItem[];
  sensitivity: SensitivityItem[];
}

export type { PvProfile };
