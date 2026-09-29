import { describe, expect, it } from "vitest";
import { CITIES, cityClimate } from "@/lib/data/locations";
import { lossFactor } from "@/lib/engine/constants";
import { computePvProfile, extraterrestrialDaily, erbsMonthlyDiffuseFraction } from "@/lib/engine/solar";

const jakarta = CITIES.find((c) => c.id === "jakarta")!;

function profileFor(city = jakarta, overrides: Partial<Parameters<typeof computePvProfile>[0]> = {}) {
  const climate = cityClimate(city);
  return computePvProfile({
    lat: city.lat,
    lon: city.lon,
    utcOffset: city.tz,
    ghi: climate.ghi,
    temp: climate.temp,
    tiltDeg: 15,
    orientation: "optimal",
    tempCoeff: -0.0035,
    lossFactor: lossFactor(0),
    ...overrides,
  });
}

describe("model radiasi surya", () => {
  it("menghitung radiasi ekstraterestrial yang wajar untuk Jakarta", () => {
    // Jakarta 17 Januari ≈ 10,6–10,8 kWh/m²/hari
    const h0 = extraterrestrialDaily(-6.2, 17);
    expect(h0).toBeGreaterThan(10.4);
    expect(h0).toBeLessThan(11);
  });

  it("fraksi difus Erbs menurun seiring indeks kecerahan", () => {
    const ws = (90 * Math.PI) / 180;
    expect(erbsMonthlyDiffuseFraction(0.35, ws)).toBeGreaterThan(erbsMonthlyDiffuseFraction(0.6, ws));
  });

  it("radiasi bidang datar sama dengan GHI (distribusi harian ternormalisasi)", () => {
    const p = profileFor(jakarta, { tiltDeg: 0 });
    p.poaDaily.forEach((poa, m) => expect(poa).toBeCloseTo(p.ghiDaily[m], 2));
  });

  it("total per jam sama dengan total harian dan tidak ada produksi malam hari", () => {
    const p = profileFor();
    p.hourly.forEach((hours, m) => {
      const sum = hours.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(p.dailyAc[m], 8);
      for (const h of [0, 1, 2, 3, 4, 20, 21, 22, 23]) expect(hours[h]).toBe(0);
    });
  });

  it("performance ratio & specific yield wajar untuk seluruh kota dalam dataset", () => {
    for (const city of CITIES) {
      const p = profileFor(city);
      expect(p.performanceRatio, city.name).toBeGreaterThan(0.72);
      expect(p.performanceRatio, city.name).toBeLessThan(0.85);
      expect(p.annualYield, city.name).toBeGreaterThan(1150);
      expect(p.annualYield, city.name).toBeLessThan(1850);
    }
  });

  it("panel menghadap khatulistiwa lebih produktif daripada arah sebaliknya", () => {
    const kupang = CITIES.find((c) => c.id === "kupang")!; // selatan khatulistiwa
    const north = profileFor(kupang, { orientation: "N", tiltDeg: 25 });
    const south = profileFor(kupang, { orientation: "S", tiltDeg: 25 });
    expect(north.annualYield).toBeGreaterThan(south.annualYield * 1.1);

    const aceh = CITIES.find((c) => c.id === "banda-aceh")!; // utara khatulistiwa
    const optimal = profileFor(aceh, { orientation: "optimal", tiltDeg: 25 });
    const facingNorth = profileFor(aceh, { orientation: "N", tiltDeg: 25 });
    expect(optimal.azimuths).toEqual([180]);
    expect(optimal.annualYield).toBeGreaterThan(facingNorth.annualYield);
  });

  it("bayangan mengurangi produksi secara proporsional", () => {
    const clean = profileFor();
    const shaded = computePvProfile({
      lat: jakarta.lat,
      lon: jakarta.lon,
      utcOffset: jakarta.tz,
      ...cityClimate(jakarta),
      tiltDeg: 15,
      orientation: "optimal",
      tempCoeff: -0.0035,
      lossFactor: lossFactor(10),
    });
    expect(shaded.annualYield / clean.annualYield).toBeCloseTo(0.9, 1);
  });
});
