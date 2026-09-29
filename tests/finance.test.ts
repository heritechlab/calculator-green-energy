import { describe, expect, it } from "vitest";
import { annuityPayment, irr, npv, paybackPeriod } from "@/lib/engine/finance";

describe("utilitas finansial", () => {
  it("NPV dan IRR sesuai perhitungan acuan", () => {
    expect(npv(0.1, [-100, 110])).toBeCloseTo(0, 8);
    expect(irr([-100, 110])!).toBeCloseTo(0.1, 6);
    // 5 × 300 terhadap 1.000 → IRR ≈ 15,24%
    expect(irr([-1000, 300, 300, 300, 300, 300])!).toBeCloseTo(0.1524, 3);
  });

  it("IRR null bila arus kas tidak pernah berubah tanda", () => {
    expect(irr([-100, -10, -10])).toBeNull();
  });

  it("payback diinterpolasi di dalam tahun", () => {
    expect(paybackPeriod([-100, 30, 30, 30, 30])).toBeCloseTo(3.3333, 3);
    expect(paybackPeriod([-100, 10, 10])).toBeNull();
    expect(paybackPeriod([0, 10])).toBe(0);
  });

  it("cicilan anuitas", () => {
    // Rp100 juta, 12%/tahun, 12 bulan → Rp8.884.879
    expect(annuityPayment(100_000_000, 0.12, 12)).toBeCloseTo(8_884_878.8, 0);
    expect(annuityPayment(12_000_000, 0, 12)).toBe(1_000_000);
  });
});
