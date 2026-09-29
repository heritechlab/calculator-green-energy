"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { CalculationResult, SensitivityItem, SizingPoint } from "@/lib/engine";
import { formatDecimal, formatKwp, formatRupiah, formatYears } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CHROME, ChartFrame, SERIES, TooltipCard, axisTick, compactRupiah, niceScale, usePrefersReducedMotion, type LegendItem } from "./chart-kit";

/** Arus kas kumulatif selama umur sistem (satu sumbu: Rupiah). */
export function CashflowChart({ result }: { result: CalculationResult }) {
  const reduced = usePrefersReducedMotion();
  const ev = result.evaluation;
  const loan = ev.loan;
  const data = useMemo(
    () => [
      { year: 0, cumulative: -ev.capex, withLoan: loan ? -loan.downPayment : null },
      ...ev.years.map((y) => ({ year: y.year, cumulative: y.cumulative, withLoan: loan ? y.cumulativeWithLoan : null })),
    ],
    [ev, loan],
  );
  const payback = ev.metrics.paybackYears;
  const values = data.flatMap((d) => (d.withLoan === null ? [d.cumulative] : [d.cumulative, d.withLoan]));
  const scale = niceScale(Math.min(...values), Math.max(...values));
  const legend: LegendItem[] = [
    { label: "Kumulatif (tunai)", color: SERIES.solar, kind: "line" },
    ...(loan ? [{ label: "Kumulatif dengan cicilan", color: SERIES.loan, kind: "line" as const }] : []),
  ];

  const Content = ({ active, payload, label }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as (typeof data)[number];
    const rows = [
      { color: SERIES.solar, label: "kumulatif tunai", value: formatRupiah(p.cumulative) },
      ...(p.withLoan !== null ? [{ color: SERIES.loan, label: "dengan cicilan", value: formatRupiah(p.withLoan) }] : []),
    ];
    return <TooltipCard title={Number(label) === 0 ? "Awal (investasi)" : `Tahun ke-${label}`} rows={rows} />;
  };

  return (
    <ChartFrame
      title="Arus kas kumulatif"
      description={
        payback !== null
          ? `Garis melewati nol pada ${formatYears(payback)} — sejak itu PLTS menghasilkan keuntungan bersih.`
          : "Akumulasi penghematan belum menutup investasi selama umur sistem."
      }
      legend={legend}
      table={{
        caption: "Arus kas kumulatif per tahun",
        columns: ["Tahun", "Kumulatif (tunai)", ...(loan ? ["Dengan cicilan"] : [])],
        rows: data.map((d) => [d.year, formatRupiah(d.cumulative), ...(loan ? [formatRupiah(d.withLoan ?? 0)] : [])]),
      }}
    >
      <ResponsiveContainer width="100%" height={280} initialDimension={{ width: 720, height: 280 }}>
        <ComposedChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="cf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={SERIES.solar} stopOpacity={0.14} />
              <stop offset="1" stopColor={SERIES.solar} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHROME.grid} />
          <XAxis dataKey="year" type="number" domain={[0, ev.years.length]} tickCount={6} allowDecimals={false} tick={axisTick} tickLine={false} axisLine={{ stroke: CHROME.axis }} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={64} tickFormatter={compactRupiah} domain={scale.domain} ticks={scale.ticks} />
          <Tooltip content={Content} cursor={{ stroke: CHROME.baseline, strokeWidth: 1 }} />
          <ReferenceLine y={0} stroke={CHROME.baseline} strokeWidth={1.5} />
          <Area type="monotone" dataKey="cumulative" stroke={SERIES.solar} strokeWidth={2} fill="url(#cf-fill)" isAnimationActive={!reduced} activeDot={{ r: 5, stroke: CHROME.surface, strokeWidth: 2 }} />
          {loan ? <Line type="monotone" dataKey="withLoan" stroke={SERIES.loan} strokeWidth={2} dot={false} isAnimationActive={!reduced} /> : null}
          {payback !== null && payback <= ev.years.length ? (
            <ReferenceDot
              x={payback}
              y={0}
              r={6}
              fill={SERIES.solar}
              stroke={CHROME.surface}
              strokeWidth={2}
              label={{ value: `Balik modal ${formatDecimal(payback, 1)} thn`, position: "top", fill: "#0f172a", fontSize: 12, fontWeight: 700, offset: 10 }}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Small multiples: NPV dan balik modal terhadap kapasitas (dua grafik, masing-masing satu sumbu). */
export function SizingCharts({ curve, selectedKwp }: { curve: SizingPoint[]; selectedKwp: number }) {
  const reduced = usePrefersReducedMotion();
  const data = useMemo(
    () => curve.map((p) => ({ kwp: Math.round(p.kwp * 100) / 100, npv: p.npv, payback: p.paybackYears })),
    [curve],
  );
  const npvScale = niceScale(Math.min(...data.map((d) => d.npv)), Math.max(...data.map((d) => d.npv)), 4);
  const paybacks = data.map((d) => d.payback).filter((v): v is number => v !== null);
  const pbScale = niceScale(0, paybacks.length ? Math.max(...paybacks) : 1, 4);
  const selected = data.reduce((best, d) => (Math.abs(d.kwp - selectedKwp) < Math.abs(best.kwp - selectedKwp) ? d : best), data[0]);
  if (data.length < 2) return null;

  const npvContent = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as (typeof data)[number];
    return <TooltipCard title={formatKwp(p.kwp)} rows={[{ color: SERIES.solar, label: "NPV", value: formatRupiah(p.npv) }]} />;
  };
  const pbContent = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as (typeof data)[number];
    return <TooltipCard title={formatKwp(p.kwp)} rows={[{ color: SERIES.grid, label: "balik modal", value: formatYears(p.payback) }]} />;
  };
  const xAxis = (
    <XAxis
      dataKey="kwp"
      type="number"
      domain={["dataMin", "dataMax"]}
      tick={axisTick}
      tickLine={false}
      axisLine={{ stroke: CHROME.axis }}
      tickFormatter={(v: number) => formatDecimal(v, v < 10 ? 1 : 0)}
      unit=""
    />
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartFrame
        title="Keuntungan bersih (NPV) per kapasitas"
        description="Titik tertinggi = ukuran dengan nilai ekonomi terbaik. Sumbu X dalam kWp."
        table={{ caption: "NPV per kapasitas", columns: ["kWp", "NPV"], rows: data.map((d) => [formatDecimal(d.kwp, 2), formatRupiah(d.npv)]) }}
      >
        <ResponsiveContainer width="100%" height={220} initialDimension={{ width: 480, height: 220 }}>
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke={CHROME.grid} />
            {xAxis}
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={64} tickFormatter={compactRupiah} domain={npvScale.domain} ticks={npvScale.ticks} />
            <Tooltip content={npvContent} cursor={{ stroke: CHROME.baseline, strokeWidth: 1 }} />
            <ReferenceLine y={0} stroke={CHROME.baseline} />
            <Line type="monotone" dataKey="npv" stroke={SERIES.solar} strokeWidth={2} dot={false} isAnimationActive={!reduced} activeDot={{ r: 5, stroke: CHROME.surface, strokeWidth: 2 }} />
            <ReferenceDot x={selected.kwp} y={selected.npv} r={6} fill={SERIES.solar} stroke={CHROME.surface} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame
        title="Lama balik modal per kapasitas"
        description="Semakin rendah semakin cepat. Titik = kapasitas yang dipilih."
        table={{ caption: "Balik modal per kapasitas", columns: ["kWp", "Balik modal"], rows: data.map((d) => [formatDecimal(d.kwp, 2), formatYears(d.payback)]) }}
      >
        <ResponsiveContainer width="100%" height={220} initialDimension={{ width: 480, height: 220 }}>
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke={CHROME.grid} />
            {xAxis}
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => `${formatDecimal(v, 1)} th`} domain={pbScale.domain} ticks={pbScale.ticks} />
            <Tooltip content={pbContent} cursor={{ stroke: CHROME.baseline, strokeWidth: 1 }} />
            <Line type="monotone" dataKey="payback" stroke={SERIES.grid} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={!reduced} activeDot={{ r: 5, stroke: CHROME.surface, strokeWidth: 2 }} />
            {selected.payback !== null ? (
              <ReferenceDot x={selected.kwp} y={selected.payback} r={6} fill={SERIES.grid} stroke={CHROME.surface} strokeWidth={2} />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

/**
 * Grafik tornado sensitivitas: perubahan lama balik modal (tahun) terhadap skenario dasar.
 * Hijau = lebih cepat (baik), merah = lebih lambat (buruk); selalu disertai label nilai.
 */
export function SensitivityTornado({ items, basePayback, lifetime }: { items: SensitivityItem[]; basePayback: number | null; lifetime: number }) {
  if (basePayback === null) {
    return (
      <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        Analisis sensitivitas balik modal tidak ditampilkan karena sistem belum balik modal dalam {lifetime} tahun pada skenario dasar.
      </p>
    );
  }
  const cap = lifetime + 1;
  const delta = (p: number | null) => (p === null ? cap - basePayback : p - basePayback);
  const maxAbs = Math.max(0.5, ...items.flatMap((i) => [Math.abs(delta(i.low.paybackYears)), Math.abs(delta(i.high.paybackYears))]));

  const Bar = ({ value, label, payback }: { value: number; label: string; payback: number | null }) => {
    const width = `${(Math.abs(value) / maxAbs) * 50}%`;
    const faster = value < 0;
    return (
      <div className="relative h-7">
        <div
          className={cn("absolute top-1 h-5 rounded-[4px]", faster ? "right-1/2 bg-[#0ca30c]" : "left-1/2 bg-[#d03b3b]")}
          style={{ width }}
          aria-hidden
        />
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-[12px] font-semibold whitespace-nowrap text-slate-700 tabular",
            faster ? "left-1/2 pl-2" : "right-1/2 pr-2",
          )}
        >
          {label}: {payback === null ? `> ${lifetime} th` : `${formatDecimal(payback, 1)} th`} ({value > 0 ? "+" : ""}
          {formatDecimal(value, 1)})
        </span>
      </div>
    );
  };

  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600">
        <span>
          Dasar: <strong className="text-slate-900">{formatDecimal(basePayback, 1)} tahun</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#0ca30c]" aria-hidden /> lebih cepat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#d03b3b]" aria-hidden /> lebih lambat
        </span>
      </figcaption>
      <ul className="flex flex-col gap-4">
        {items.map((i) => {
          const lo = delta(i.low.paybackYears);
          const hi = delta(i.high.paybackYears);
          return (
            <li key={i.id} className="rounded-2xl border border-slate-100 p-3">
              <p className="mb-1.5 text-sm font-semibold text-slate-800">{i.label}</p>
              <div className="relative">
                <span className="absolute inset-y-0 left-1/2 w-px bg-slate-300" aria-hidden />
                <Bar value={lo} label={i.lowLabel} payback={i.low.paybackYears} />
                <Bar value={hi} label={i.highLabel} payback={i.high.paybackYears} />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
