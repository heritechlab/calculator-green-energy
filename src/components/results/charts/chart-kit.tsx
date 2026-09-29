"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Warna seri tervalidasi (lihat globals.css). Teks tidak pernah memakai warna seri. */
export const SERIES = {
  solar: "#059669",
  battery: "#d946ef",
  grid: "#0284c7",
  pv: "#d97706",
  surplus: "#ea580c",
  loan: "#0284c7",
} as const;

export const CHROME = {
  grid: "#e2e8f0",
  axis: "#cbd5e1",
  tick: "#64748b",
  surface: "#ffffff",
  baseline: "#94a3b8",
} as const;

export const axisTick = { fill: CHROME.tick, fontSize: 12 } as const;

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
export function compactNumber(v: number): string {
  return compact.format(v);
}
export function compactRupiah(v: number): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}Rp${compact.format(Math.abs(v))}`;
}

/** Skala sumbu dengan tick "bulat" (1, 2, 2,5, 5 × 10ⁿ) yang selalu memuat nol. */
export function niceScale(min: number, max: number, count = 6): { domain: [number, number]; ticks: number[] } {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  const span = hi - lo || 1;
  const raw = span / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= end + step / 2; t += step) ticks.push(Number(t.toPrecision(12)));
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}

/** Media query reaktif (false saat render server). */
export function useMediaQuery(query: string): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Layar sempit (≤ 480 px): pakai label sumbu ringkas. */
export function useNarrow(): boolean {
  return useMediaQuery("(max-width: 480px)");
}

export interface LegendItem {
  label: string;
  color: string;
  kind: "rect" | "line";
}

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-slate-600", className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.kind === "rect" ? (
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} aria-hidden />
          ) : (
            <span className="h-[3px] w-4 rounded-full" style={{ background: i.color }} aria-hidden />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}

interface TooltipRow {
  color: string;
  label: string;
  value: string;
}

/** Isi tooltip: nilai tebal di depan, nama seri sekunder, kunci berupa garis pendek. */
export function TooltipCard({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: string }) {
  return (
    <div className="min-w-44 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-[13px] shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold text-slate-500">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2">
            <span className="h-[3px] w-3 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
            <span className="font-bold text-slate-900 tabular">{r.value}</span>
            <span className="text-slate-500">{r.label}</span>
          </li>
        ))}
      </ul>
      {footer ? <p className="mt-1.5 border-t border-slate-100 pt-1.5 font-semibold text-slate-700">{footer}</p> : null}
    </div>
  );
}

/** Bingkai grafik: judul, deskripsi, legenda, grafik, dan tabel data (alternatif aksesibel). */
export function ChartFrame({
  title,
  description,
  legend,
  children,
  table,
  aside,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  legend?: LegendItem[];
  children: React.ReactNode;
  table?: { columns: string[]; rows: (string | number)[][]; caption?: string };
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "print-avoid-break m-0 flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5",
        className,
      )}
    >
      <figcaption className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          {description ? <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p> : null}
        </div>
        {aside}
      </figcaption>
      {legend && legend.length > 1 ? <ChartLegend items={legend} /> : null}
      <div className="min-w-0">{children}</div>
      {table ? (
        <details className="no-print group text-[13px]">
          <summary className="cursor-pointer font-semibold text-emerald-700 hover:text-emerald-800">Lihat data tabel</summary>
          <div className="scroll-thin mt-2 overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left tabular">
              {table.caption ? <caption className="sr-only">{table.caption}</caption> : null}
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="px-2 py-1.5 font-semibold whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    {r.map((cell, j) =>
                      j === 0 ? (
                        <th key={j} scope="row" className="px-2 py-1.5 font-semibold whitespace-nowrap text-slate-700">
                          {cell}
                        </th>
                      ) : (
                        <td key={j} className="px-2 py-1.5 whitespace-nowrap text-slate-700">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </figure>
  );
}
