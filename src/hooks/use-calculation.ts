"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  calculate,
  calculateExtras,
  calculatorInputSchema,
  type CalculationExtras,
  type CalculationResult,
  type CalculatorInput,
} from "@/lib/engine";

export interface CalculationState {
  result: CalculationResult | null;
  issues: { path: string; message: string }[];
  /** true bila hasil yang ditampilkan berasal dari input valid sebelumnya. */
  stale: boolean;
}

type Computed = { result: CalculationResult | null; issues: { path: string; message: string }[] };

function compute(input: CalculatorInput): Computed {
  const parsed = calculatorInputSchema.safeParse(input);
  if (!parsed.success) {
    return { result: null, issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) };
  }
  try {
    return { result: calculate(parsed.data), issues: [] };
  } catch (error) {
    console.error("[kalkulator] gagal menghitung", error);
    return { result: null, issues: [{ path: "", message: "Perhitungan gagal." }] };
  }
}

/** Perhitungan live (di peramban) dengan input yang ditangguhkan agar UI tetap responsif. */
export function useCalculation(input: CalculatorInput): CalculationState {
  const deferred = useDeferredValue(input);
  const computed = useMemo(() => compute(deferred), [deferred]);
  // Simpan hasil valid terakhir (pola "derived state") agar UI tidak berkedip saat input sementara tidak valid.
  const [lastGood, setLastGood] = useState<CalculationResult | null>(computed.result);
  if (computed.result && computed.result !== lastGood) setLastGood(computed.result);
  return {
    result: computed.result ?? lastGood,
    issues: computed.issues,
    stale: !computed.result || deferred !== input,
  };
}

/** Perbandingan sistem & sensitivitas — dihitung setelah hasil utama tampil. */
export function useExtras(result: CalculationResult | null): CalculationExtras | null {
  const [state, setState] = useState<{ key: CalculationResult | null; extras: CalculationExtras | null }>({
    key: null,
    extras: null,
  });
  useEffect(() => {
    if (!result) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      try {
        const extras = calculateExtras(result.input, result);
        if (!cancelled) setState({ key: result, extras });
      } catch (error) {
        console.error("[kalkulator] gagal menghitung ekstra", error);
      }
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [result]);
  return state.key === result ? state.extras : (state.extras ?? null);
}
