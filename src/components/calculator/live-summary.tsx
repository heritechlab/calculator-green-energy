"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, ChevronUp, Leaf, Loader2 } from "lucide-react";
import { SYSTEM_LABELS, type CalculationResult } from "@/lib/engine";
import { formatKwp, formatPercent, formatRupiah, formatRupiahCompact, formatYears } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/stat";
import { FeasibilityBadge } from "@/components/results/feasibility-badge";

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={cn("text-right text-sm font-bold text-slate-900", strong && "text-base text-emerald-700")}>{value}</dd>
    </div>
  );
}

/** Panel ringkasan live (desktop). */
export function LiveSummary({
  result,
  stale,
  onShowResults,
}: {
  result: CalculationResult | null;
  stale: boolean;
  onShowResults: () => void;
}) {
  if (!result) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-soft">
        Lengkapi isian untuk melihat estimasi.
      </div>
    );
  }
  const ev = result.evaluation;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-soft transition-opacity",
        stale && "opacity-70",
      )}
    >
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-emerald-100 uppercase">
          Estimasi sementara {stale ? <Loader2 className="h-3 w-3 animate-spin" aria-label="Menghitung" /> : null}
        </p>
        <p className="mt-2 text-sm text-emerald-50">PLTS {SYSTEM_LABELS[result.system.type]}</p>
        <p className="text-3xl font-extrabold tracking-tight">{formatKwp(result.system.kwp)}</p>
        <p className="mt-1 text-xs text-emerald-100">
          {result.system.panelCount} panel × {result.system.panelWp} Wp
          {result.system.batteryKwh > 0
            ? ` · baterai ${result.system.batteryKwh.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kWh`
            : ""}
        </p>
      </div>
      <div className="p-5">
        <dl className="divide-y divide-slate-100">
          <Row label="Investasi awal" value={formatRupiah(ev.capex)} />
          <Row label="Hemat per bulan" value={formatRupiah(ev.year1.savings / 12)} strong />
          <Row label="Balik modal" value={formatYears(ev.metrics.paybackYears)} />
          <Row label="Tagihan setelah PLTS" value={`${formatRupiahCompact(ev.year1.billAfter / 12)}/bln`} />
        </dl>
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> Porsi energi hijau
            </span>
            <span>{formatPercent(ev.year1.solarFractionPct)}</span>
          </div>
          <Meter value={ev.year1.solarFractionPct} label="Porsi energi hijau" />
        </div>
        <div className="mt-4">
          <FeasibilityBadge level={result.feasibility.level} />
        </div>
        <Button className="mt-5 w-full" onClick={onShowResults}>
          <BarChart3 className="h-4 w-4" aria-hidden /> Lihat hasil lengkap
        </Button>
      </div>
    </div>
  );
}

/** Bar bawah untuk mobile: ringkasan + navigasi langkah. */
export function MobileWizardBar({
  result,
  canBack,
  isLast,
  onBack,
  onNext,
}: {
  result: CalculationResult | null;
  canBack: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ev = result?.evaluation;
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(6,78,59,0.25)] backdrop-blur lg:hidden">
      {result && ev ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 px-4 pt-2.5 text-left"
        >
          <span className="min-w-0 truncate text-sm">
            <span className="font-extrabold text-emerald-700">{formatKwp(result.system.kwp)}</span>
            <span className="text-slate-400"> · </span>
            <span className="font-semibold text-slate-800">{formatRupiahCompact(ev.capex)}</span>
            <span className="text-slate-400"> · </span>
            <span className="font-semibold text-slate-800">
              BM{" "}
              {ev.metrics.paybackYears === null
                ? "–"
                : `${ev.metrics.paybackYears.toLocaleString("id-ID", { maximumFractionDigits: 1 })} th`}
            </span>
          </span>
          <ChevronUp className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", !open && "rotate-180")} aria-hidden />
        </button>
      ) : null}
      {open && result && ev ? (
        <dl className="grid grid-cols-2 gap-2 px-4 pt-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <dt className="text-xs text-slate-500">Hemat/bulan</dt>
            <dd className="font-bold text-emerald-700">{formatRupiah(ev.year1.savings / 12)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <dt className="text-xs text-slate-500">Balik modal</dt>
            <dd className="font-bold text-slate-900">{formatYears(ev.metrics.paybackYears)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <dt className="text-xs text-slate-500">Panel</dt>
            <dd className="font-bold text-slate-900">
              {result.system.panelCount} × {result.system.panelWp} Wp
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <dt className="text-xs text-slate-500">Energi hijau</dt>
            <dd className="font-bold text-slate-900">{formatPercent(ev.year1.solarFractionPct)}</dd>
          </div>
        </dl>
      ) : null}
      <div className="flex gap-2 px-4 py-2.5">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canBack}
          className="w-28"
          aria-label="Kembali ke langkah sebelumnya"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali
        </Button>
        <Button onClick={onNext} className="flex-1">
          {isLast ? "Lihat hasil" : "Lanjut"} <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
