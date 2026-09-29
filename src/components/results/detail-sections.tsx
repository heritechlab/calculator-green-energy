"use client";

import { Check, CheckCircle2, Landmark, Minus, X } from "lucide-react";
import type { CalculationExtras, CalculationResult, SizingOption, SystemType } from "@/lib/engine";
import { formatDecimal, formatKwh, formatKwp, formatPercent, formatRupiah, formatRupiahCompact, formatYears } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeasibilityBadge } from "./feasibility-badge";

export function CashflowTable({ result }: { result: CalculationResult }) {
  const ev = result.evaluation;
  const hasLoan = ev.loan !== null;
  return (
    <details data-print-open className="group rounded-2xl border border-slate-200/80 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-bold text-slate-900">Tabel arus kas tahunan</span>
          <span className="block text-[13px] text-slate-500">Produksi, penghematan, biaya, dan kumulatif per tahun</span>
        </span>
        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 group-open:hidden">
          Tampilkan
        </span>
        <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 group-open:inline">
          Sembunyikan
        </span>
      </summary>
      <div className="scroll-thin overflow-x-auto border-t border-slate-100">
        <table className="w-full min-w-[760px] border-collapse text-right text-[13px] tabular">
          <caption className="sr-only">Arus kas tahunan</caption>
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {[
                "Tahun",
                "Produksi",
                "Hemat tagihan",
                "O&M",
                "Penggantian",
                "Arus kas",
                "Kumulatif",
                ...(hasLoan ? ["Cicilan", "Kumulatif + cicilan"] : []),
              ].map((h, i) => (
                <th key={h} scope="col" className={cn("px-3 py-2.5 font-semibold whitespace-nowrap", i === 0 && "text-left")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <th scope="row" className="px-3 py-2 text-left font-semibold text-slate-700">
                0
              </th>
              <td className="px-3 py-2 text-slate-400">–</td>
              <td className="px-3 py-2 text-slate-400">–</td>
              <td className="px-3 py-2 text-slate-400">–</td>
              <td className="px-3 py-2 text-slate-700">{formatRupiah(ev.capex)}</td>
              <td className="px-3 py-2 font-semibold text-rose-700">{formatRupiah(-ev.capex)}</td>
              <td className="px-3 py-2 font-semibold text-rose-700">{formatRupiah(-ev.capex)}</td>
              {hasLoan ? (
                <>
                  <td className="px-3 py-2 text-slate-400">–</td>
                  <td className="px-3 py-2 font-semibold text-rose-700">{formatRupiah(-(ev.loan?.downPayment ?? 0))}</td>
                </>
              ) : null}
            </tr>
            {ev.years.map((y) => (
              <tr key={y.year} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <th scope="row" className="px-3 py-2 text-left font-semibold text-slate-700">
                  {y.year}
                </th>
                <td className="px-3 py-2 text-slate-700">{formatKwh(y.production)}</td>
                <td className="px-3 py-2 text-slate-700">{formatRupiah(y.savings)}</td>
                <td className="px-3 py-2 text-slate-700">{formatRupiah(-y.om)}</td>
                <td className="px-3 py-2 text-slate-700" title={y.replacementItems.join(", ")}>
                  {y.replacement > 0 ? `${formatRupiah(-y.replacement)} (${y.replacementItems.join(", ")})` : "–"}
                </td>
                <td className="px-3 py-2 font-semibold text-slate-900">{formatRupiah(y.cashflow)}</td>
                <td className={cn("px-3 py-2 font-semibold", y.cumulative >= 0 ? "text-emerald-700" : "text-rose-700")}>
                  {formatRupiah(y.cumulative)}
                </td>
                {hasLoan ? (
                  <>
                    <td className="px-3 py-2 text-slate-700">{y.loanPayment > 0 ? formatRupiah(-y.loanPayment) : "–"}</td>
                    <td
                      className={cn("px-3 py-2 font-semibold", y.cumulativeWithLoan >= 0 ? "text-emerald-700" : "text-rose-700")}
                    >
                      {formatRupiah(y.cumulativeWithLoan)}
                    </td>
                  </>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function LoanCard({ result }: { result: CalculationResult }) {
  const loan = result.evaluation.loan;
  if (!loan) return null;
  const monthlySavings = result.evaluation.year1.savings / 12;
  const positive = loan.monthlyNetYear1 >= 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-emerald-700" aria-hidden /> Simulasi cicilan
        </CardTitle>
        <CardDescription>
          DP {formatPercent((loan.downPayment / result.evaluation.capex) * 100)} · bunga {formatDecimal(loan.ratePct, 1)}%/th ·
          tenor {loan.tenorYears} tahun
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-[13px] text-slate-500">Cicilan per bulan</dt>
            <dd className="mt-1 text-xl font-bold text-slate-900">{formatRupiah(loan.monthlyInstallment)}</dd>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <dt className="text-[13px] text-emerald-800">Hemat per bulan</dt>
            <dd className="mt-1 text-xl font-bold text-emerald-800">{formatRupiah(monthlySavings)}</dd>
          </div>
          <div className={cn("rounded-2xl p-4", positive ? "bg-emerald-50" : "bg-amber-50")}>
            <dt className={cn("text-[13px]", positive ? "text-emerald-800" : "text-amber-900")}>Selisih per bulan</dt>
            <dd className={cn("mt-1 text-xl font-bold", positive ? "text-emerald-800" : "text-amber-900")}>
              {positive ? "+" : ""}
              {formatRupiah(loan.monthlyNetYear1)}
            </dd>
          </div>
        </dl>
        <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <li>
            Uang muka: <strong className="text-slate-900">{formatRupiah(loan.downPayment)}</strong>
          </li>
          <li>
            Total bunga: <strong className="text-slate-900">{formatRupiah(loan.totalInterest)}</strong>
          </li>
          <li>
            Modal sendiri kembali: <strong className="text-slate-900">{formatYears(loan.paybackYearsOnEquity)}</strong>
          </li>
          <li>
            Untung bersih setelah bunga: <strong className="text-slate-900">{formatRupiahCompact(loan.netBenefit)}</strong>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

export function SizingOptionsList({
  options,
  currentKwp,
  onApply,
}: {
  options: SizingOption[];
  currentKwp: number;
  onApply?: (kwp: number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {options.map((o) => {
        const active = Math.abs(o.point.kwp - currentKwp) < 1e-6;
        return (
          <div
            key={`${o.id}-${o.point.panelCount}`}
            className={cn(
              "flex flex-col rounded-2xl border p-4",
              active ? "border-emerald-500 bg-emerald-50/60" : "border-slate-200 bg-white",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">{o.label}</p>
              {active ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Dipakai
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatKwp(o.point.kwp)}</p>
            <p className="text-[13px] text-slate-500">
              {o.point.panelCount} panel{o.point.batteryKwh > 0 ? ` · baterai ${formatDecimal(o.point.batteryKwh, 1)} kWh` : ""}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
              <dt className="text-slate-500">Investasi</dt>
              <dd className="text-right font-semibold text-slate-800">{formatRupiahCompact(o.point.capex)}</dd>
              <dt className="text-slate-500">Hemat/tahun</dt>
              <dd className="text-right font-semibold text-slate-800">{formatRupiahCompact(o.point.annualSavings)}</dd>
              <dt className="text-slate-500">Balik modal</dt>
              <dd className="text-right font-semibold text-slate-800">
                {o.point.paybackYears === null ? "–" : `${formatDecimal(o.point.paybackYears, 1)} th`}
              </dd>
              <dt className="text-slate-500">Energi hijau</dt>
              <dd className="text-right font-semibold text-slate-800">{formatPercent(o.point.solarFractionPct)}</dd>
            </dl>
            <p className="mt-3 flex-1 text-[12px] leading-relaxed text-slate-500">{o.description}</p>
            {onApply && !active ? (
              <Button variant="secondary" size="sm" className="no-print mt-3" onClick={() => onApply(o.point.kwp)}>
                Gunakan ukuran ini
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ComparisonTable({
  extras,
  currentType,
  onSwitch,
}: {
  extras: CalculationExtras | null;
  currentType: SystemType;
  onSwitch?: (type: SystemType) => void;
}) {
  if (!extras) {
    return (
      <div className="h-64 animate-pulse-soft rounded-2xl bg-slate-100" aria-busy="true" aria-label="Menghitung perbandingan" />
    );
  }
  const items = extras.comparison;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((c) => {
        const current = c.type === currentType;
        return (
          <div
            key={c.type}
            className={cn(
              "flex flex-col rounded-3xl border p-5",
              current ? "border-emerald-500 bg-white shadow-soft ring-4 ring-emerald-500/10" : "border-slate-200 bg-white",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-lg font-extrabold text-slate-900">PLTS {c.label}</h4>
              {current ? (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">Pilihan Anda</span>
              ) : null}
            </div>
            {c.applicable ? (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  {formatKwp(c.kwp)}
                  {c.batteryKwh > 0 ? ` + baterai ${formatDecimal(c.batteryKwh, 1)} kWh` : ""}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-500">Investasi</dt>
                  <dd className="text-right font-bold text-slate-900">{formatRupiahCompact(c.capex)}</dd>
                  <dt className="text-slate-500">Hemat/bulan</dt>
                  <dd className="text-right font-bold text-slate-900">{formatRupiahCompact(c.monthlySavings)}</dd>
                  <dt className="text-slate-500">Balik modal</dt>
                  <dd className="text-right font-bold text-slate-900">{formatYears(c.paybackYears, "> umur")}</dd>
                  <dt className="text-slate-500">NPV</dt>
                  <dd className="text-right font-bold text-slate-900">{formatRupiahCompact(c.npv)}</dd>
                  <dt className="text-slate-500">Energi hijau</dt>
                  <dd className="text-right font-bold text-slate-900">{formatPercent(c.solarFractionPct)}</dd>
                </dl>
                <div className="mt-4">
                  <FeasibilityBadge level={c.feasibility} className="text-xs" />
                </div>
              </>
            ) : (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <Minus className="h-4 w-4 shrink-0" aria-hidden /> {c.note}
              </p>
            )}
            <ul className="mt-4 flex flex-1 flex-col gap-1.5 text-[13px] text-slate-600">
              {c.pros.map((p) => (
                <li key={p} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> {p}
                </li>
              ))}
              {c.cons.map((p) => (
                <li key={p} className="flex gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden /> {p}
                </li>
              ))}
            </ul>
            {onSwitch && !current && c.applicable ? (
              <Button variant="outline" size="sm" className="no-print mt-4" onClick={() => onSwitch(c.type)}>
                Hitung dengan {c.label}
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function AssumptionsList({ result }: { result: CalculationResult }) {
  const groups = [...new Set(result.assumptions.map((a) => a.group))];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((g) => (
        <div key={g} className="print-avoid-break rounded-2xl border border-slate-200/80 bg-white p-5">
          <h4 className="text-sm font-bold text-slate-900">{g}</h4>
          <dl className="mt-3 divide-y divide-slate-100">
            {result.assumptions
              .filter((a) => a.group === g)
              .map((a) => (
                <div key={a.label} className="flex items-start justify-between gap-4 py-2 text-[13px]">
                  <dt className="text-slate-500">{a.label}</dt>
                  <dd className="text-right font-semibold text-slate-800">{a.value}</dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
