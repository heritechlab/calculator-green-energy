import { describe, expect, it } from "vitest";
import { calculate, calculateExtras, createDefaultInput, resolveInput, summarize, type CalculatorInput } from "@/lib/engine";
import { MODEL } from "@/lib/engine/constants";

function input(mutate: (i: CalculatorInput) => void = () => {}, city = "jakarta"): CalculatorInput {
  const i = createDefaultInput(city);
  mutate(i);
  return i;
}

describe("engine perhitungan PLTS", () => {
  it("menghasilkan rekomendasi yang valid untuk input default", () => {
    const r = calculate(input());
    const ev = r.evaluation;
    expect(r.system.kwp).toBeGreaterThan(0);
    expect(r.system.panelCount).toBeGreaterThan(0);
    expect(ev.capex).toBeGreaterThan(0);
    expect(ev.year1.savings).toBeGreaterThan(0);
    expect(ev.years).toHaveLength(25);
    expect(ev.monthly).toHaveLength(12);
    expect(ev.daily).toHaveLength(12);
    expect(Number.isFinite(ev.metrics.npv)).toBe(true);
    expect(r.consumption.monthlyKwh[0]).toBeCloseTo(1_000_000 / (1444.7 * 1.03), 3);
  });

  it("menjaga keseimbangan energi per jam (on-grid, hybrid, off-grid)", () => {
    for (const type of ["on-grid", "hybrid", "off-grid"] as const) {
      const r = calculate(input((i) => (i.system.type = type)));
      for (const d of r.evaluation.daily) {
        for (let h = 0; h < 24; h++) {
          expect(d.direct[h] + d.charge[h] + d.exported[h]).toBeCloseTo(d.pv[h], 9);
          expect(d.direct[h] + d.discharge[h] + d.gridImport[h] + d.unmet[h]).toBeCloseTo(d.load[h], 9);
        }
        const charged = d.charge.reduce((a, b) => a + b, 0);
        const discharged = d.discharge.reduce((a, b) => a + b, 0);
        expect(discharged).toBeLessThanOrEqual(charged * MODEL.battery.roundTripEfficiency + 1e-6);
      }
      expect(r.evaluation.year1.selfConsumptionPct).toBeLessThanOrEqual(100 + 1e-9);
    }
  });

  it("mematuhi batas daya tersambung dan luas atap", () => {
    const limited = calculate(input((i) => (i.consumption.monthlyBill = 5_000_000)));
    expect(limited.system.kwp).toBeLessThanOrEqual((2200 * MODEL.dcAcRatio) / 1000 + 1e-9);

    const roof = calculate(
      input((i) => {
        i.consumption.tariffId = "R3";
        i.consumption.va = 16500;
        i.consumption.monthlyBill = 6_000_000;
        i.roof.areaM2 = 20;
      }),
    );
    expect(roof.system.roofAreaM2).toBeLessThanOrEqual(20 + 1e-9);
    expect(roof.system.limitingFactor).toBe("roof");
    expect(roof.warnings.map((w) => w.code)).toContain("ROOF_LIMITED");
  });

  it("mode manual membulatkan ke jumlah panel", () => {
    const r = calculate(
      input((i) => {
        i.system.sizingMode = "manual";
        i.system.manualKwp = 3;
        i.system.limitToConnection = false;
      }),
    );
    expect(r.system.panelCount).toBe(Math.round(3000 / 550));
  });

  it("mode target mencapai porsi energi surya yang diminta bila memungkinkan", () => {
    const r = calculate(
      input((i) => {
        i.consumption.tariffId = "B2";
        i.consumption.va = 53000;
        i.consumption.monthlyBill = 20_000_000;
        i.consumption.profileId = "kantor";
        i.system.sizingMode = "target";
        i.system.targetPct = 40;
      }),
    );
    expect(r.evaluation.year1.solarFractionPct).toBeGreaterThanOrEqual(40 - 1e-6);
  });

  it("memberi peringatan bila target tidak tercapai", () => {
    const r = calculate(
      input((i) => {
        i.system.sizingMode = "target";
        i.system.targetPct = 90;
      }),
    );
    expect(r.warnings.map((w) => w.code)).toContain("TARGET_NOT_REACHED");
  });

  it("tarif bersubsidi dinilai belum layak", () => {
    const r = calculate(
      input((i) => {
        i.consumption.tariffId = "R1-900S";
        i.consumption.va = 900;
        i.consumption.monthlyBill = 200_000;
      }),
    );
    expect(r.feasibility.level).toBe("tidak-layak");
    expect(r.warnings.map((w) => w.code)).toContain("SUBSIDIZED_TARIFF");
  });

  it("kompensasi ekspor menambah penghematan sistem yang kelebihan kapasitas", () => {
    const base = (comp: number) =>
      calculate(
        input((i) => {
          i.system.sizingMode = "manual";
          i.system.manualKwp = 2.2;
          i.finance.exportCompensationPct = comp;
        }),
      ).evaluation.year1.savings;
    expect(base(100)).toBeGreaterThan(base(0));
  });

  it("menerapkan rekening minimum pada sistem yang terlalu besar", () => {
    const r = calculate(
      input((i) => {
        i.consumption.monthlyBill = 150_000;
        i.consumption.profileId = "kantor";
        i.system.sizingMode = "manual";
        i.system.manualKwp = 2.2;
      }),
    );
    expect(r.evaluation.year1.minimumBillMonths).toBeGreaterThan(0);
    for (const m of r.evaluation.monthly) {
      expect(m.billAfter).toBeGreaterThanOrEqual(r.consumption.minimumMonthlyKwh * 1444.7 * 1.03 - 1e-6);
    }
  });

  it("sistem off-grid memenuhi hampir seluruh kebutuhan", () => {
    const r = calculate(input((i) => (i.system.type = "off-grid"), "kupang"));
    expect(r.system.batteryKwh).toBeGreaterThan(0);
    expect(r.evaluation.year1.solarFractionPct).toBeGreaterThan(99);
    expect(r.evaluation.year1.unmet / r.evaluation.year1.consumption).toBeLessThanOrEqual(0.01);
  });

  it("baterai mode cadangan selalu menyisakan energi cadangan padam", () => {
    const r = calculate(
      input((i) => {
        i.system.type = "hybrid";
        i.system.batteryMode = "backup";
        i.system.backupHours = 4;
        i.system.backupLoadW = 500;
      }),
    );
    const capacity = r.system.batteryKwh;
    const reserveFloor = (capacity * (1 - MODEL.battery.dod) + 2) / capacity; // 4 jam × 500 W = 2 kWh
    for (const d of r.evaluation.daily) {
      expect(Math.min(...d.soc)).toBeGreaterThanOrEqual(reserveFloor - 1e-9);
    }
    expect(r.system.backupHours).toBeGreaterThanOrEqual(4);
    const surplus = calculate(
      input((i) => {
        i.system.type = "hybrid";
        i.system.batteryMode = "manual";
        i.system.manualBatteryKwh = capacity;
      }),
    );
    expect(r.evaluation.year1.fromBattery).toBeLessThan(surplus.evaluation.year1.fromBattery);
  });

  it("menghitung cicilan dan arus kas pembiayaan", () => {
    const r = calculate(
      input((i) => {
        i.finance.paymentMode = "loan";
        i.finance.downPaymentPct = 20;
        i.finance.loanRatePct = 12;
        i.finance.loanTenorYears = 3;
      }),
    );
    const loan = r.evaluation.loan!;
    expect(loan.downPayment).toBeCloseTo(r.evaluation.capex * 0.2, 2);
    expect(loan.principal + loan.downPayment).toBeCloseTo(r.evaluation.capex, 2);
    expect(r.evaluation.years[0].loanPayment).toBeCloseTo(loan.monthlyInstallment * 12, 2);
    expect(r.evaluation.years[3].loanPayment).toBe(0);
  });

  it("menghasilkan perbandingan sistem dan sensitivitas", () => {
    const i = input();
    const r = calculate(i);
    const extras = calculateExtras(i, r);
    expect(extras.comparison.map((c) => c.type)).toEqual(["on-grid", "hybrid", "off-grid"]);
    const current = extras.comparison.find((c) => c.type === "on-grid")!;
    expect(current.kwp).toBeCloseTo(r.system.kwp, 6);
    expect(extras.sensitivity).toHaveLength(4);
    const capex = extras.sensitivity.find((s) => s.id === "capex")!;
    expect(capex.low.npv).toBeGreaterThan(capex.high.npv);
  });

  it("perbandingan off-grid dilewati untuk pemakaian skala industri", () => {
    const i = input((x) => {
      x.consumption.tariffId = "I3";
      x.consumption.va = 555000;
      x.consumption.monthlyBill = 400_000_000;
      x.consumption.profileId = "usaha-24";
    });
    const extras = calculateExtras(i, calculate(i));
    expect(extras.comparison.find((c) => c.type === "off-grid")!.applicable).toBe(false);
  });

  it("ringkasan memuat metrik utama", () => {
    const s = summarize(calculate(input()));
    expect(s).toMatchObject({ systemType: "on-grid", locationName: "Jakarta" });
    expect(s.kwp).toBeGreaterThan(0);
    expect(s.capex).toBeGreaterThan(0);
  });
});

describe("resolveInput", () => {
  it("melengkapi input parsial dengan default & data kota", () => {
    const res = resolveInput({ location: { cityId: "surabaya" }, consumption: { monthlyBill: 1_500_000, tariffId: "R2" } });
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.location.name).toBe("Surabaya");
    expect(res.data.location.ghi).toHaveLength(12);
    expect(res.data.consumption.va).toBe(3500);
    expect(res.data.consumption.monthlyBill).toBe(1_500_000);
  });

  it("memakai kota terdekat untuk koordinat bebas", () => {
    const res = resolveInput({ location: { lat: -6.95, lon: 107.65 } });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.location.province).toBe("Jawa Barat");
  });

  it("menolak input tidak valid dengan pesan berbahasa Indonesia", () => {
    const res = resolveInput({ consumption: { monthlyBill: 1000 }, finance: { lifetimeYears: 99 } });
    expect(res.success).toBe(false);
    if (res.success) return;
    const paths = res.issues.map((i) => i.path);
    expect(paths).toContain("consumption.monthlyBill");
    expect(paths).toContain("finance.lifetimeYears");
    expect(res.issues.find((i) => i.path === "consumption.monthlyBill")!.message).toMatch(/Tagihan minimal/);
  });

  it("menolak body bukan objek", () => {
    expect(resolveInput("halo").success).toBe(false);
  });
});
