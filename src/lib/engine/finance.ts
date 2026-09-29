/** Utilitas finansial murni. Arus kas `cashflows[0]` adalah tahun ke-0 (investasi). */

export function npv(rate: number, cashflows: number[]): number {
  let total = 0;
  for (let t = 0; t < cashflows.length; t++) total += cashflows[t] / Math.pow(1 + rate, t);
  return total;
}

/** IRR dengan metode bisection. Mengembalikan null bila tidak ada perubahan tanda. */
export function irr(cashflows: number[], lo = -0.95, hi = 5): number | null {
  let fLo = npv(lo, cashflows);
  let fHi = npv(hi, cashflows);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, cashflows);
    if (Math.abs(fMid) < 1e-6 || hi - lo < 1e-9) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Periode balik modal (tahun, pecahan) dari arus kas; interpolasi linier di dalam tahun.
 * Null jika kumulatif tidak pernah ≥ 0.
 */
export function paybackPeriod(cashflows: number[]): number | null {
  let cumulative = cashflows[0];
  if (cumulative >= 0) return 0;
  for (let t = 1; t < cashflows.length; t++) {
    const prev = cumulative;
    cumulative += cashflows[t];
    if (cumulative >= 0) {
      const cf = cashflows[t];
      return cf > 0 ? t - 1 + -prev / cf : t;
    }
  }
  return null;
}

export function discountedCashflows(rate: number, cashflows: number[]): number[] {
  return cashflows.map((cf, t) => cf / Math.pow(1 + rate, t));
}

/** Cicilan anuitas bulanan. */
export function annuityPayment(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const i = annualRate / 12;
  if (i === 0) return principal / months;
  return (principal * i) / (1 - Math.pow(1 + i, -months));
}
