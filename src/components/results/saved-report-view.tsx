"use client";

import { useMemo } from "react";
import { calculate, type CalculatorInput } from "@/lib/engine";
import { ResultsView, type ReportMeta } from "./results-view";

/** Laporan tersimpan: dihitung ulang dari input dengan engine yang sama. */
export function SavedReportView({ input, report }: { input: CalculatorInput; report: ReportMeta }) {
  const result = useMemo(() => calculate(input), [input]);
  return <ResultsView result={result} context="report" report={report} />;
}
