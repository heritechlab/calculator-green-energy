import { AVG_DAY_OF_MONTH, DAYS_IN_MONTH, MODEL } from "./constants";
import type { Orientation } from "./input";

const DEG = Math.PI / 180;
const SOLAR_CONSTANT_KW = 1.367;

export interface PvModelParams {
  lat: number;
  lon: number;
  utcOffset: number;
  /** GHI bulanan (kWh/m²/hari). */
  ghi: number[];
  /** Suhu udara rata-rata bulanan (°C). */
  temp: number[];
  tiltDeg: number;
  orientation: Orientation;
  /** Koefisien suhu daya panel (fraksi/°C, negatif). */
  tempCoeff: number;
  /** Faktor susut non-suhu (0–1). */
  lossFactor: number;
  inverterEfficiency?: number;
  dcAcRatio?: number;
}

export interface PvProfile {
  /** Energi AC per kWp per jam lokal untuk hari representatif tiap bulan: [12][24] (kWh). */
  hourly: number[][];
  /** Energi AC harian per kWp (kWh/kWp/hari). */
  dailyAc: number[];
  /** Radiasi pada bidang panel (kWh/m²/hari). */
  poaDaily: number[];
  ghiDaily: number[];
  annualYield: number;
  annualPoa: number;
  annualGhi: number;
  performanceRatio: number;
  /** Susut akibat suhu (fraksi energi). */
  temperatureLoss: number;
  tiltDeg: number;
  /** Azimut kompas yang dipakai (0 = Utara, 90 = Timur). */
  azimuths: number[];
}

export function declinationRad(dayOfYear: number): number {
  return 23.45 * DEG * Math.sin(((2 * Math.PI) / 365) * (284 + dayOfYear));
}

/** Equation of time (menit), Spencer (1971). */
export function equationOfTimeMinutes(dayOfYear: number): number {
  const b = ((dayOfYear - 1) * 2 * Math.PI) / 365;
  return (
    229.2 * (0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b) - 0.014615 * Math.cos(2 * b) - 0.04089 * Math.sin(2 * b))
  );
}

/** Radiasi ekstraterestrial harian pada bidang horizontal (kWh/m²/hari). */
export function extraterrestrialDaily(latDeg: number, dayOfYear: number): number {
  const phi = latDeg * DEG;
  const delta = declinationRad(dayOfYear);
  const ws = Math.acos(clamp(-Math.tan(phi) * Math.tan(delta), -1, 1));
  return (
    (24 / Math.PI) *
    SOLAR_CONSTANT_KW *
    (1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365)) *
    (Math.cos(phi) * Math.cos(delta) * Math.sin(ws) + ws * Math.sin(phi) * Math.sin(delta))
  );
}

/** Fraksi difus harian rata-rata bulanan (Erbs dkk., 1982). */
export function erbsMonthlyDiffuseFraction(kt: number, sunsetHourAngleRad: number): number {
  const k = clamp(kt, 0.3, 0.8);
  const f =
    sunsetHourAngleRad <= 81.4 * DEG
      ? 1.391 - 3.56 * k + 4.189 * k * k - 2.137 * k * k * k
      : 1.311 - 3.022 * k + 3.427 * k * k - 1.821 * k * k * k;
  return clamp(f, 0.1, 1);
}

/** Azimut kompas untuk orientasi (Utara = 0°, Timur = 90°). */
export function orientationAzimuths(orientation: Orientation, lat: number): number[] {
  switch (orientation) {
    case "optimal":
      return [lat < 0 ? 0 : 180];
    case "N":
      return [0];
    case "NE":
      return [45];
    case "E":
      return [90];
    case "SE":
      return [135];
    case "S":
      return [180];
    case "SW":
      return [225];
    case "W":
      return [270];
    case "NW":
      return [315];
    case "EW":
      return [90, 270];
  }
}

interface Step {
  omega: number;
  clockHour: number;
  rt: number;
  rd: number;
}

/**
 * Model produksi PV per kWp untuk hari representatif setiap bulan.
 * Radiasi harian didistribusikan per 10 menit (Collares-Pereira & Rabl / Liu & Jordan),
 * ditransposisikan ke bidang miring (model isotropik), lalu dikoreksi suhu sel dan susut.
 */
export function computePvProfile(params: PvModelParams): PvProfile {
  const inverterEff = params.inverterEfficiency ?? MODEL.inverterEfficiency;
  const acLimit = 1 / (params.dcAcRatio ?? MODEL.dcAcRatio);
  const dt = MODEL.stepHours;
  const stepsPerDay = Math.round(24 / dt);
  const beta = clamp(params.tiltDeg, 0, 90) * DEG;
  const cosBeta = Math.cos(beta);
  const sinBeta = Math.sin(beta);
  const azimuths = orientationAzimuths(params.orientation, params.lat);
  // Konvensi Duffie & Beckman: γ = 0 menghadap selatan, barat positif.
  const gammas = azimuths.map((az) => wrapDeg(az - 180) * DEG);
  const phi = params.lat * DEG;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const noctFactor = (MODEL.noctEffective - 20) / 800;

  const hourly: number[][] = [];
  const dailyAc: number[] = [];
  const poaDaily: number[] = [];
  const ghiDaily: number[] = [];
  let energyAtStc = 0; // energi tanpa efek suhu (untuk menghitung susut suhu)
  let energyWithTemp = 0;

  for (let m = 0; m < 12; m++) {
    const n = AVG_DAY_OF_MONTH[m];
    const delta = declinationRad(n);
    const sinDelta = Math.sin(delta);
    const cosDelta = Math.cos(delta);
    const ws = Math.acos(clamp(-Math.tan(phi) * Math.tan(delta), -1, 1));
    const cosWs = Math.cos(ws);
    const h0 = extraterrestrialDaily(params.lat, n);
    const H = Math.max(0, params.ghi[m]);
    const kt = h0 > 0 ? H / h0 : 0.5;
    const Hd = H * erbsMonthlyDiffuseFraction(kt, ws);
    const a = 0.409 + 0.5016 * Math.sin(ws - Math.PI / 3);
    const b = 0.6609 - 0.4767 * Math.sin(ws - Math.PI / 3);
    const denom = Math.sin(ws) - ws * cosWs;
    // Waktu surya = jam lokal + koreksi bujur + equation of time.
    const solarMinusClock = (4 * (params.lon - 15 * params.utcOffset) + equationOfTimeMinutes(n)) / 60;

    const steps: Step[] = [];
    let sumRt = 0;
    let sumRd = 0;
    for (let k = 0; k < stepsPerDay; k++) {
      const solarHour = (k + 0.5) * dt;
      const omega = (solarHour - 12) * 15 * DEG;
      if (Math.abs(omega) >= ws) continue;
      const cosW = Math.cos(omega);
      const rd = (Math.PI / 24) * ((cosW - cosWs) / denom);
      const rt = rd * (a + b * cosW);
      if (rt <= 0) continue;
      steps.push({ omega, clockHour: solarHour - solarMinusClock, rt, rd });
      sumRt += rt;
      sumRd += rd;
    }

    const hours = new Array<number>(24).fill(0);
    let dayAc = 0;
    let dayPoa = 0;
    const tMean = params.temp[m];
    for (const s of steps) {
      const g = (H * s.rt) / sumRt;
      const gd = Math.min(g, (Hd * s.rd) / sumRd);
      const gb = g - gd;
      const cosW = Math.cos(s.omega);
      const sinW = Math.sin(s.omega);
      const cosZ = cosPhi * cosDelta * cosW + sinPhi * sinDelta;

      let poa = 0;
      for (const gamma of gammas) {
        const cosG = Math.cos(gamma);
        const sinG = Math.sin(gamma);
        const cosTheta =
          sinDelta * sinPhi * cosBeta -
          sinDelta * cosPhi * sinBeta * cosG +
          cosDelta * cosPhi * cosBeta * cosW +
          cosDelta * sinPhi * sinBeta * cosG * cosW +
          cosDelta * sinBeta * sinG * sinW;
        const rb = cosZ > 0.02 ? Math.min(5, Math.max(0, cosTheta) / cosZ) : 0;
        poa += gb * rb + gd * ((1 + cosBeta) / 2) + g * MODEL.albedo * ((1 - cosBeta) / 2);
      }
      poa /= gammas.length;

      const irradianceW = (poa / dt) * 1000;
      const ambient = tMean + MODEL.dailyTempAmplitude * Math.cos((2 * Math.PI * (s.clockHour - MODEL.tempPeakHour)) / 24);
      const cellTemp = ambient + noctFactor * irradianceW;
      const tempFactor = Math.max(0, 1 + params.tempCoeff * (cellTemp - 25));
      const pStc = (irradianceW / 1000) * params.lossFactor;
      const pDc = pStc * tempFactor;
      const pAc = Math.min(pDc * inverterEff, acLimit);
      const energy = pAc * dt;

      const bin = ((Math.floor(s.clockHour) % 24) + 24) % 24;
      hours[bin] += energy;
      dayAc += energy;
      dayPoa += poa;
      energyAtStc += pStc * dt * DAYS_IN_MONTH[m];
      energyWithTemp += pDc * dt * DAYS_IN_MONTH[m];
    }

    hourly.push(hours);
    dailyAc.push(dayAc);
    poaDaily.push(dayPoa);
    ghiDaily.push(H);
  }

  const annualYield = sumMonthly(dailyAc);
  const annualPoa = sumMonthly(poaDaily);
  const annualGhi = sumMonthly(ghiDaily);
  return {
    hourly,
    dailyAc,
    poaDaily,
    ghiDaily,
    annualYield,
    annualPoa,
    annualGhi,
    performanceRatio: annualPoa > 0 ? annualYield / annualPoa : 0,
    temperatureLoss: energyAtStc > 0 ? 1 - energyWithTemp / energyAtStc : 0,
    tiltDeg: params.tiltDeg,
    azimuths,
  };
}

/** Skalakan profil (mis. untuk sensitivitas radiasi ±10%). */
export function scalePvProfile(profile: PvProfile, factor: number): PvProfile {
  return {
    ...profile,
    hourly: profile.hourly.map((row) => row.map((v) => v * factor)),
    dailyAc: profile.dailyAc.map((v) => v * factor),
    poaDaily: profile.poaDaily.map((v) => v * factor),
    ghiDaily: profile.ghiDaily.map((v) => v * factor),
    annualYield: profile.annualYield * factor,
    annualPoa: profile.annualPoa * factor,
    annualGhi: profile.annualGhi * factor,
  };
}

function sumMonthly(daily: number[]): number {
  return daily.reduce((acc, v, m) => acc + v * DAYS_IN_MONTH[m], 0);
}

function wrapDeg(d: number): number {
  let x = d % 360;
  if (x > 180) x -= 360;
  if (x <= -180) x += 360;
  return x;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
