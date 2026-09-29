import { z } from "zod";
import { CUSTOM_TARIFF_ID, getTariff, TARIFFS } from "@/lib/data/tariffs";
import { cityClimate, DEFAULT_CITY_ID, getCity, nearestCity, timezoneFromLongitude } from "@/lib/data/locations";
import { DEFAULT_PANEL_ID, PANELS } from "@/lib/data/panels";
import { DEFAULT_BATTERY_PRICE_PER_KWH } from "@/lib/data/prices";

z.config(z.locales.id());

export const ORIENTATIONS = ["optimal", "N", "NE", "E", "SE", "S", "SW", "W", "NW", "EW"] as const;
export const LOAD_PROFILE_IDS = ["rumah-malam", "rumah-siang", "kantor", "toko", "usaha-24", "kustom"] as const;
export const SYSTEM_TYPES = ["on-grid", "hybrid", "off-grid"] as const;

const month12 = (min: number, max: number) => z.array(z.number().min(min).max(max)).length(12);

export const locationSchema = z.object({
  cityId: z.string().max(64).nullable(),
  name: z.string().trim().min(1).max(120),
  province: z.string().max(120).optional(),
  lat: z.number().min(-11.5).max(6.5),
  lon: z.number().min(94.5).max(141.5),
  utcOffset: z.union([z.literal(7), z.literal(8), z.literal(9)]),
  ghi: month12(1, 9),
  temp: month12(5, 40),
  source: z.enum(["dataset", "nasa-power", "manual"]),
});

export const roofSchema = z.object({
  areaM2: z.number().min(1).max(1_000_000).nullable(),
  tiltDeg: z.number().min(0).max(60),
  orientation: z.enum(ORIENTATIONS),
  shadingPct: z.number().min(0).max(50),
});

export const consumptionSchema = z.object({
  tariffId: z.string().refine((id) => id === CUSTOM_TARIFF_ID || TARIFFS.some((t) => t.id === id), {
    message: "Golongan tarif tidak dikenal",
  }),
  va: z.number().int().min(450).max(100_000_000),
  customRate: z.number().min(100).max(10_000).nullable(),
  inputMode: z.enum(["bill", "kwh", "monthly"]),
  monthlyBill: z.number().min(50_000, "Tagihan minimal Rp50.000").max(10_000_000_000),
  monthlyKwh: z.number().min(10, "Pemakaian minimal 10 kWh").max(10_000_000),
  monthlyKwhSeries: z.array(z.number().min(0).max(10_000_000)).length(12).nullable(),
  profileId: z.enum(LOAD_PROFILE_IDS),
  daytimeSharePct: z.number().min(5).max(95),
  meterType: z.enum(["prepaid", "postpaid"]),
  pbjtPct: z.number().min(0).max(15),
  growthPct: z.number().min(0).max(20),
});

export const systemSchema = z.object({
  type: z.enum(SYSTEM_TYPES),
  sizingMode: z.enum(["optimal", "target", "manual"]),
  targetPct: z.number().min(5).max(100),
  manualKwp: z.number().min(0.3).max(10_000),
  panelId: z.string().refine((id) => PANELS.some((p) => p.id === id), { message: "Tipe panel tidak dikenal" }),
  limitToConnection: z.boolean(),
  batteryMode: z.enum(["surplus", "backup", "manual"]),
  backupHours: z.number().min(0.5).max(72),
  backupLoadW: z.number().min(50).max(5_000_000),
  manualBatteryKwh: z.number().min(1).max(100_000),
  autonomyDays: z.number().min(0.5).max(5),
  offgridBaseline: z.enum(["pln", "genset"]),
  gensetCostPerKwh: z.number().min(500).max(50_000),
});

export const financeSchema = z.object({
  priceTier: z.enum(["ekonomis", "standar", "premium"]),
  pricePerKwpOverride: z.number().min(1_000_000).max(100_000_000).nullable(),
  batteryPricePerKwh: z.number().min(500_000).max(50_000_000),
  extraCost: z.number().min(0).max(100_000_000_000),
  paymentMode: z.enum(["cash", "loan"]),
  downPaymentPct: z.number().min(0).max(100),
  loanRatePct: z.number().min(0).max(40),
  loanTenorYears: z.number().int().min(1).max(20),
  tariffEscalationPct: z.number().min(0).max(15),
  inflationPct: z.number().min(0).max(15),
  discountRatePct: z.number().min(0).max(25),
  lifetimeYears: z.number().int().min(10).max(30),
  degradationFirstYearPct: z.number().min(0).max(5),
  degradationPct: z.number().min(0).max(2),
  omPct: z.number().min(0).max(5),
  inverterLifeYears: z.number().int().min(5).max(25),
  inverterReplacementPct: z.number().min(0).max(40),
  batteryLifeYears: z.number().int().min(3).max(25),
  exportCompensationPct: z.number().min(0).max(100),
  emissionFactor: z.number().min(0.1).max(1.5),
});

export const calculatorInputSchema = z.object({
  version: z.literal(1),
  location: locationSchema,
  roof: roofSchema,
  consumption: consumptionSchema,
  system: systemSchema,
  finance: financeSchema,
});

export type CalculatorInput = z.infer<typeof calculatorInputSchema>;
export type LocationInput = CalculatorInput["location"];
export type RoofInput = CalculatorInput["roof"];
export type ConsumptionInput = CalculatorInput["consumption"];
export type SystemInput = CalculatorInput["system"];
export type FinanceInput = CalculatorInput["finance"];
export type Orientation = (typeof ORIENTATIONS)[number];
export type SystemType = (typeof SYSTEM_TYPES)[number];

export function locationFromCity(cityId: string): LocationInput {
  const city = getCity(cityId) ?? getCity(DEFAULT_CITY_ID)!;
  const climate = cityClimate(city);
  return {
    cityId: city.id,
    name: city.name,
    province: city.province,
    lat: city.lat,
    lon: city.lon,
    utcOffset: city.tz,
    ghi: climate.ghi,
    temp: climate.temp,
    source: "dataset",
  };
}

/** Lokasi dari koordinat bebas: iklim diambil dari kota terdekat (estimasi). */
export function locationFromCoordinates(lat: number, lon: number, name?: string): LocationInput {
  const { city, distanceKm } = nearestCity(lat, lon);
  const climate = cityClimate(city);
  return {
    cityId: distanceKm < 15 ? city.id : null,
    name: name ?? (distanceKm < 15 ? city.name : `Dekat ${city.name}`),
    province: city.province,
    lat: Math.round(lat * 10000) / 10000,
    lon: Math.round(lon * 10000) / 10000,
    utcOffset: timezoneFromLongitude(lon),
    ghi: climate.ghi,
    temp: climate.temp,
    source: "dataset",
  };
}

export function createDefaultInput(cityId: string = DEFAULT_CITY_ID): CalculatorInput {
  return {
    version: 1,
    location: locationFromCity(cityId),
    roof: { areaM2: null, tiltDeg: 15, orientation: "optimal", shadingPct: 0 },
    consumption: {
      tariffId: "R1-2200",
      va: 2200,
      customRate: null,
      inputMode: "bill",
      monthlyBill: 1_000_000,
      monthlyKwh: 650,
      monthlyKwhSeries: null,
      profileId: "rumah-malam",
      daytimeSharePct: 40,
      meterType: "prepaid",
      pbjtPct: 3,
      growthPct: 0,
    },
    system: {
      type: "on-grid",
      sizingMode: "optimal",
      targetPct: 50,
      manualKwp: 3,
      panelId: DEFAULT_PANEL_ID,
      limitToConnection: true,
      batteryMode: "surplus",
      backupHours: 4,
      backupLoadW: 500,
      manualBatteryKwh: 10.24,
      autonomyDays: 1,
      offgridBaseline: "pln",
      gensetCostPerKwh: 6000,
    },
    finance: {
      priceTier: "standar",
      pricePerKwpOverride: null,
      batteryPricePerKwh: DEFAULT_BATTERY_PRICE_PER_KWH,
      extraCost: 0,
      paymentMode: "cash",
      downPaymentPct: 20,
      loanRatePct: 11,
      loanTenorYears: 5,
      tariffEscalationPct: 3,
      inflationPct: 3,
      discountRatePct: 6,
      lifetimeYears: 25,
      degradationFirstYearPct: 1,
      degradationPct: 0.5,
      omPct: 1,
      inverterLifeYears: 12,
      inverterReplacementPct: 10,
      batteryLifeYears: 10,
      exportCompensationPct: 0,
      emissionFactor: 0.84,
    },
  };
}

type DeepPartial<T> = T extends unknown[] ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
export type PartialCalculatorInput = DeepPartial<CalculatorInput>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(patch) || !isPlainObject(base)) return (patch === undefined ? base : patch) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = out[key];
    out[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
  }
  return out as T;
}

export type InputIssue = { path: string; message: string };

/**
 * Lengkapi input parsial dengan nilai default lalu validasi.
 * - Jika `location.cityId` diberikan tanpa data iklim, iklim diisi dari dataset kota.
 * - Jika hanya koordinat yang diberikan, iklim diambil dari kota terdekat.
 * - Daya (VA) mengikuti default golongan bila tidak diisi.
 */
export function resolveInput(raw: unknown): { success: true; data: CalculatorInput } | { success: false; issues: InputIssue[] } {
  if (!isPlainObject(raw)) {
    return { success: false, issues: [{ path: "", message: "Body harus berupa objek JSON" }] };
  }
  const rawLocation = isPlainObject(raw.location) ? raw.location : {};
  const cityId = typeof rawLocation.cityId === "string" ? rawLocation.cityId : undefined;
  const hasClimate = Array.isArray(rawLocation.ghi) && Array.isArray(rawLocation.temp);

  let base = createDefaultInput(cityId && getCity(cityId) ? cityId : DEFAULT_CITY_ID);
  if (!cityId && typeof rawLocation.lat === "number" && typeof rawLocation.lon === "number" && !hasClimate) {
    base = { ...base, location: locationFromCoordinates(rawLocation.lat, rawLocation.lon) };
  }

  const rawConsumption = isPlainObject(raw.consumption) ? raw.consumption : {};
  if (typeof rawConsumption.tariffId === "string" && rawConsumption.va === undefined) {
    const tariff = getTariff(rawConsumption.tariffId);
    if (tariff) base = { ...base, consumption: { ...base.consumption, va: tariff.defaultVa } };
  }

  const merged = deepMerge(base, { ...raw, version: 1 });
  const parsed = calculatorInputSchema.safeParse(merged);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    };
  }
  return { success: true, data: parsed.data };
}
