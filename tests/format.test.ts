import { describe, expect, it } from "vitest";
import { formatKwp, formatPercent, formatRupiah, formatRupiahCompact, formatYears, parseLocaleNumber } from "@/lib/format";

describe("format id-ID", () => {
  it("memformat Rupiah", () => {
    expect(formatRupiah(1_500_000)).toBe("Rp1.500.000");
    expect(formatRupiah(-25_000.4)).toBe("-Rp25.000");
    expect(formatRupiahCompact(1_250_000)).toBe("Rp1,3 jt");
    expect(formatRupiahCompact(850_000)).toBe("Rp850 rb");
    expect(formatRupiahCompact(2_100_000_000)).toBe("Rp2,1 M");
  });

  it("memformat durasi balik modal", () => {
    expect(formatYears(7.08)).toBe("7 tahun 1 bulan");
    expect(formatYears(5)).toBe("5 tahun");
    expect(formatYears(0.5)).toBe("6 bulan");
    expect(formatYears(3.99)).toBe("4 tahun");
    expect(formatYears(null)).toBe("Tidak balik modal");
  });

  it("memformat kapasitas & persen", () => {
    expect(formatKwp(3.3)).toBe("3,3 kWp");
    expect(formatKwp(2506.9)).toBe("2,51 MWp");
    expect(formatPercent(41.3, 1)).toBe("41,3%");
  });

  it("mengurai angka lokal", () => {
    expect(parseLocaleNumber("Rp 1.500.000")).toBe(1_500_000);
    expect(parseLocaleNumber("1,5")).toBe(1.5);
    expect(parseLocaleNumber("abc")).toBeNull();
  });
});
