"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { CalculationResult } from "@/lib/engine";
import { MONTH_LABELS, MONTH_NAMES } from "@/lib/engine/constants";
import { formatKwh, formatNumber } from "@/lib/format";
import { NativeSelect } from "@/components/ui/select";
import { CHROME, ChartFrame, SERIES, TooltipCard, axisTick, compactNumber, niceScale, useNarrow, usePrefersReducedMotion, type LegendItem } from "./chart-kit";

const HEIGHT = 260;
const BAR_GAP_STROKE = { stroke: CHROME.surface, strokeWidth: 2 } as const;

type Row = Record<string, number | string>;

function kwhTooltip(title: (label: string | number | undefined) => string, labels: Record<string, string>, footer?: (p: Row) => string) {
  return function Content({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    const rows = payload
      .filter((p) => typeof p.value === "number" && (p.value as number) > 0.0005)
      .map((p) => ({
        color: (p.color as string) ?? "#000",
        label: labels[String(p.dataKey)] ?? String(p.name),
        value: formatKwh(p.value as number),
      }))
      .reverse();
    return <TooltipCard title={title(label)} rows={rows} footer={footer ? footer(payload[0].payload as Row) : undefined} />;
  };
}

/** Grafik bulanan: dari mana listrik Anda berasal & ke mana produksi PLTS mengalir. */
export function MonthlyEnergyCharts({ result }: { result: CalculationResult }) {
  const reduced = usePrefersReducedMotion();
  const narrow = useNarrow();
  const monthTick = (m: string) => (narrow ? m.charAt(0) : m);
  const monthly = result.evaluation.monthly;
  const hasBattery = result.system.batteryKwh > 0;
  const hasUnmet = monthly.some((m) => m.unmet > 0.5);
  const offgrid = result.system.type === "off-grid";

  const data = useMemo(
    () =>
      monthly.map((m) => ({
        month: MONTH_LABELS[m.month],
        direct: m.direct,
        fromBattery: m.fromBattery,
        gridImport: m.gridImport,
        unmet: m.unmet,
        charge: Math.max(0, m.production - m.direct - m.exported),
        exported: m.exported,
        consumption: m.consumption,
        production: m.production,
      })),
    [monthly],
  );

  const sourceScale = niceScale(0, Math.max(...data.map((d) => d.consumption)));
  const useScale = niceScale(0, Math.max(...data.map((d) => d.production)));

  const sourceLegend: LegendItem[] = [
    { label: "Langsung dari PLTS", color: SERIES.solar, kind: "rect" },
    ...(hasBattery ? [{ label: "Dari baterai", color: SERIES.battery, kind: "rect" as const }] : []),
    ...(offgrid ? [] : [{ label: "Dari PLN", color: SERIES.grid, kind: "rect" as const }]),
    ...(hasUnmet ? [{ label: "Tidak terpenuhi", color: "#64748b", kind: "rect" as const }] : []),
  ];
  const useLegend: LegendItem[] = [
    { label: "Dipakai langsung", color: SERIES.solar, kind: "rect" },
    ...(hasBattery ? [{ label: "Disimpan ke baterai", color: SERIES.battery, kind: "rect" as const }] : []),
    { label: offgrid ? "Surplus terbuang" : "Surplus ke PLN (tanpa kompensasi)", color: SERIES.surplus, kind: "rect" },
  ];

  const sourceKeys = ["direct", ...(hasBattery ? ["fromBattery"] : []), ...(offgrid ? [] : ["gridImport"]), ...(hasUnmet ? ["unmet"] : [])];
  const useKeys = ["direct", ...(hasBattery ? ["charge"] : []), "exported"];
  const colors: Record<string, string> = {
    direct: SERIES.solar,
    fromBattery: SERIES.battery,
    gridImport: SERIES.grid,
    unmet: "#64748b",
    charge: SERIES.battery,
    exported: SERIES.surplus,
  };
  const labels: Record<string, string> = {
    direct: "langsung dari PLTS",
    fromBattery: "dari baterai",
    gridImport: "dari PLN",
    unmet: "tidak terpenuhi",
    charge: "ke baterai",
    exported: "surplus",
  };

  const monthTitle = (l: string | number | undefined) => MONTH_NAMES[MONTH_LABELS.indexOf(String(l))] ?? String(l);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartFrame
        title="Dari mana listrik Anda berasal"
        description="Pemakaian bulanan tahun pertama menurut sumbernya (kWh)."
        legend={sourceLegend}
        table={{
          caption: "Sumber listrik bulanan (kWh)",
          columns: ["Bulan", "Konsumsi", "Dari PLTS", ...(hasBattery ? ["Dari baterai"] : []), ...(offgrid ? [] : ["Dari PLN"])],
          rows: data.map((d) => [
            MONTH_NAMES[MONTH_LABELS.indexOf(d.month)],
            formatNumber(d.consumption),
            formatNumber(d.direct),
            ...(hasBattery ? [formatNumber(d.fromBattery)] : []),
            ...(offgrid ? [] : [formatNumber(d.gridImport)]),
          ]),
        }}
      >
        <ResponsiveContainer width="100%" height={HEIGHT} initialDimension={{ width: 520, height: HEIGHT }}>
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={CHROME.grid} />
            <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={{ stroke: CHROME.axis }} interval={0} fontSize={11} tickFormatter={monthTick} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={compactNumber} domain={sourceScale.domain} ticks={sourceScale.ticks} />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.04)" }}
              content={kwhTooltip(monthTitle, labels, (p) => `Total ${formatKwh(Number(p.consumption))}`)}
            />
            {sourceKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                stackId="source"
                fill={colors[k]}
                maxBarSize={24}
                {...BAR_GAP_STROKE}
                radius={i === sourceKeys.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={!reduced}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame
        title="Ke mana produksi PLTS mengalir"
        description="Produksi bulanan tahun pertama menurut pemanfaatannya (kWh)."
        legend={useLegend}
        table={{
          caption: "Pemanfaatan produksi bulanan (kWh)",
          columns: ["Bulan", "Produksi", "Dipakai langsung", ...(hasBattery ? ["Ke baterai"] : []), "Surplus"],
          rows: data.map((d) => [
            MONTH_NAMES[MONTH_LABELS.indexOf(d.month)],
            formatNumber(d.production),
            formatNumber(d.direct),
            ...(hasBattery ? [formatNumber(d.charge)] : []),
            formatNumber(d.exported),
          ]),
        }}
      >
        <ResponsiveContainer width="100%" height={HEIGHT} initialDimension={{ width: 520, height: HEIGHT }}>
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={CHROME.grid} />
            <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={{ stroke: CHROME.axis }} interval={0} fontSize={11} tickFormatter={monthTick} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={compactNumber} domain={useScale.domain} ticks={useScale.ticks} />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.04)" }}
              content={kwhTooltip(monthTitle, labels, (p) => `Produksi ${formatKwh(Number(p.production))}`)}
            />
            {useKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                stackId="use"
                fill={colors[k]}
                maxBarSize={24}
                {...BAR_GAP_STROKE}
                radius={i === useKeys.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={!reduced}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

/** Profil harian 24 jam: komposisi beban (area bertumpuk) + produksi PLTS (garis). */
export function DailyProfileChart({ result }: { result: CalculationResult }) {
  const reduced = usePrefersReducedMotion();
  const narrow = useNarrow();
  const [month, setMonth] = useState<number>(-1);
  const hasBattery = result.system.batteryKwh > 0;
  const offgrid = result.system.type === "off-grid";
  const daily = result.evaluation.daily;

  const data = useMemo(() => {
    const pick = (key: keyof (typeof daily)[number], h: number) =>
      month >= 0 ? daily[month][key][h] : daily.reduce((a, d) => a + d[key][h], 0) / daily.length;
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}.00`,
      direct: pick("direct", h),
      discharge: pick("discharge", h),
      gridImport: pick("gridImport", h),
      unmet: pick("unmet", h),
      pv: pick("pv", h),
      load: pick("load", h),
    }));
  }, [daily, month]);

  const hasUnmet = data.some((d) => d.unmet > 0.001);
  const scale = niceScale(0, Math.max(...data.map((d) => Math.max(d.load, d.pv))));
  const legend: LegendItem[] = [
    { label: "Produksi PLTS", color: SERIES.pv, kind: "line" },
    { label: "Pakai langsung dari PLTS", color: SERIES.solar, kind: "rect" },
    ...(hasBattery ? [{ label: "Dari baterai", color: SERIES.battery, kind: "rect" as const }] : []),
    ...(offgrid ? [] : [{ label: "Dari PLN", color: SERIES.grid, kind: "rect" as const }]),
    ...(hasUnmet ? [{ label: "Tidak terpenuhi", color: "#64748b", kind: "rect" as const }] : []),
  ];
  const areaKeys = ["direct", ...(hasBattery ? ["discharge"] : []), ...(offgrid ? [] : ["gridImport"]), ...(hasUnmet ? ["unmet"] : [])];
  const colors: Record<string, string> = { direct: SERIES.solar, discharge: SERIES.battery, gridImport: SERIES.grid, unmet: "#64748b" };
  const labels: Record<string, string> = {
    direct: "langsung dari PLTS",
    discharge: "dari baterai",
    gridImport: "dari PLN",
    unmet: "tidak terpenuhi",
    pv: "produksi PLTS",
  };

  const Content = ({ active, payload, label }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as (typeof data)[number];
    const rows = [
      { color: SERIES.pv, label: labels.pv, value: formatKwh(p.pv) },
      ...areaKeys
        .filter((k) => (p[k as keyof typeof p] as number) > 0.0005)
        .map((k) => ({ color: colors[k], label: labels[k], value: formatKwh(p[k as keyof typeof p] as number) })),
    ];
    return <TooltipCard title={`Pukul ${label}`} rows={rows} footer={`Pemakaian ${formatKwh(p.load)}`} />;
  };

  return (
    <ChartFrame
      title="Profil listrik harian"
      description="Energi per jam pada hari representatif (kWh). Area = sumber pemakaian; garis = produksi PLTS. Jarak antara garis dan area hijau adalah surplus."
      legend={legend}
      aside={
        <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
          <span className="sr-only sm:not-sr-only">Bulan</span>
          <NativeSelect value={month} onChange={(e) => setMonth(Number(e.target.value))} className="h-9 w-44 rounded-lg py-0 text-sm">
            <option value={-1}>Rata-rata tahunan</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </NativeSelect>
        </label>
      }
      table={{
        caption: "Profil energi per jam (kWh)",
        columns: ["Jam", "Pemakaian", "Produksi PLTS", "Dari PLTS", ...(hasBattery ? ["Dari baterai"] : []), ...(offgrid ? [] : ["Dari PLN"])],
        rows: data.map((d) => [
          d.hour,
          formatKwh(d.load),
          formatKwh(d.pv),
          formatKwh(d.direct),
          ...(hasBattery ? [formatKwh(d.discharge)] : []),
          ...(offgrid ? [] : [formatKwh(d.gridImport)]),
        ]),
      }}
    >
      <ResponsiveContainer width="100%" height={HEIGHT + 20} initialDimension={{ width: 720, height: HEIGHT + 20 }}>
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHROME.grid} />
          <XAxis
            dataKey="hour"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: CHROME.axis }}
            interval={narrow ? 5 : 2}
            fontSize={11}
            tickFormatter={(h: string) => (narrow ? h.slice(0, 2) : h)}
          />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => formatNumber(v, v < 10 ? 1 : 0)} domain={scale.domain} ticks={scale.ticks} />
          <Tooltip content={Content} cursor={{ stroke: CHROME.baseline, strokeWidth: 1 }} />
          {areaKeys.map((k) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stackId="load"
              stroke={CHROME.surface}
              strokeWidth={2}
              fill={colors[k]}
              fillOpacity={0.85}
              isAnimationActive={!reduced}
            />
          ))}
          <Line type="monotone" dataKey="pv" stroke={SERIES.pv} strokeWidth={2.5} dot={false} activeDot={{ r: 5, stroke: CHROME.surface, strokeWidth: 2 }} isAnimationActive={!reduced} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
