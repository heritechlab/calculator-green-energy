import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { irradianceCache } from "@/lib/db/schema";
import { cityClimate, nearestCity } from "@/lib/data/locations";

export interface IrradianceData {
  source: "nasa-power" | "dataset";
  lat: number;
  lon: number;
  ghi: number[];
  temp: number[];
  /** Kota acuan bila memakai dataset. */
  city: { id: string; name: string; province: string; distanceKm: number } | null;
  fetchedAt: number | null;
  cached: boolean;
}

const MONTH_KEYS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const CACHE_TTL_MS = 180 * 24 * 60 * 60 * 1000;
const NASA_TIMEOUT_MS = 8000;
const NASA_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point";

/** Cache cadangan di memori bila database tidak tersedia. */
const memoryCache = new Map<string, { ghi: number[]; temp: number[]; fetchedAt: number }>();

export function cacheKey(lat: number, lon: number): { key: string; lat: number; lon: number } {
  const rLat = Math.round(lat * 4) / 4;
  const rLon = Math.round(lon * 4) / 4;
  return { key: `${rLat.toFixed(2)},${rLon.toFixed(2)}`, lat: rLat, lon: rLon };
}

export function nasaPowerEnabled(): boolean {
  return (process.env.NASA_POWER_ENABLED ?? "true").toLowerCase() !== "false";
}

/** Parse respons klimatologi NASA POWER menjadi 12 nilai GHI & suhu. */
export function parseNasaPower(json: unknown): { ghi: number[]; temp: number[] } | null {
  const parameter = (json as { properties?: { parameter?: Record<string, Record<string, number>> } })?.properties?.parameter;
  const ghiRaw = parameter?.ALLSKY_SFC_SW_DWN;
  const tempRaw = parameter?.T2M;
  if (!ghiRaw || !tempRaw) return null;
  const ghi = MONTH_KEYS.map((k) => ghiRaw[k]);
  const temp = MONTH_KEYS.map((k) => tempRaw[k]);
  const valid =
    ghi.every((v) => typeof v === "number" && v >= 1 && v <= 9) && temp.every((v) => typeof v === "number" && v >= 5 && v <= 40);
  return valid ? { ghi: ghi.map(round2), temp: temp.map(round2) } : null;
}

async function fetchNasaPower(lat: number, lon: number): Promise<{ ghi: number[]; temp: number[] } | null> {
  const url = new URL(NASA_URL);
  url.search = new URLSearchParams({
    parameters: "ALLSKY_SFC_SW_DWN,T2M",
    community: "RE",
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    format: "JSON",
  }).toString();
  const response = await fetch(url, {
    signal: AbortSignal.timeout(NASA_TIMEOUT_MS),
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return parseNasaPower(await response.json());
}

function datasetFallback(lat: number, lon: number): IrradianceData {
  const { city, distanceKm } = nearestCity(lat, lon);
  const climate = cityClimate(city);
  return {
    source: "dataset",
    lat,
    lon,
    ghi: climate.ghi,
    temp: climate.temp,
    city: { id: city.id, name: city.name, province: city.province, distanceKm: Math.round(distanceKm) },
    fetchedAt: null,
    cached: false,
  };
}

async function readCache(key: string) {
  try {
    const db = await getDb();
    const rows = await db.select().from(irradianceCache).where(eq(irradianceCache.key, key)).limit(1);
    const row = rows[0];
    if (row)
      return { ghi: JSON.parse(row.ghiJson) as number[], temp: JSON.parse(row.tempJson) as number[], fetchedAt: row.fetchedAt };
  } catch {
    // Database tidak tersedia — pakai cache memori.
  }
  return memoryCache.get(key) ?? null;
}

async function writeCache(key: string, lat: number, lon: number, data: { ghi: number[]; temp: number[] }, fetchedAt: number) {
  memoryCache.set(key, { ...data, fetchedAt });
  try {
    const db = await getDb();
    const values = {
      key,
      lat,
      lon,
      source: "nasa-power",
      ghiJson: JSON.stringify(data.ghi),
      tempJson: JSON.stringify(data.temp),
      fetchedAt,
    };
    await db.insert(irradianceCache).values(values).onConflictDoUpdate({ target: irradianceCache.key, set: values });
  } catch {
    // Abaikan kegagalan cache.
  }
}

/**
 * Data radiasi bulanan untuk koordinat: cache → NASA POWER → dataset kota terdekat.
 * Tidak pernah melempar error; selalu mengembalikan data yang bisa dipakai.
 */
export async function getIrradiance(lat: number, lon: number, fetcher = fetchNasaPower): Promise<IrradianceData> {
  const { key, lat: rLat, lon: rLon } = cacheKey(lat, lon);
  const cached = await readCache(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      source: "nasa-power",
      lat: rLat,
      lon: rLon,
      ghi: cached.ghi,
      temp: cached.temp,
      city: null,
      fetchedAt: cached.fetchedAt,
      cached: true,
    };
  }
  if (nasaPowerEnabled()) {
    try {
      const data = await fetcher(rLat, rLon);
      if (data) {
        const fetchedAt = Date.now();
        await writeCache(key, rLat, rLon, data, fetchedAt);
        return { source: "nasa-power", lat: rLat, lon: rLon, ...data, city: null, fetchedAt, cached: false };
      }
    } catch {
      // Timeout / jaringan diblokir — gunakan dataset.
    }
  }
  if (cached) {
    // Cache kedaluwarsa tetap lebih baik daripada estimasi regional.
    return {
      source: "nasa-power",
      lat: rLat,
      lon: rLon,
      ghi: cached.ghi,
      temp: cached.temp,
      city: null,
      fetchedAt: cached.fetchedAt,
      cached: true,
    };
  }
  return datasetFallback(lat, lon);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
