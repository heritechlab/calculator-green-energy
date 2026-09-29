import * as React from "react";
import { cn } from "@/lib/utils";

/** Stat tile: label · nilai · keterangan (angka besar memakai figure proporsional). */
export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = "default",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "green" | "amber" | "sky";
  className?: string;
}) {
  const iconTone = {
    default: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
  }[tone];
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white p-4", className)}>
      <div className="flex items-center gap-2">
        {icon ? (
          <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", iconTone)}>{icon}</span>
        ) : null}
        <span className="text-[13px] font-medium leading-tight text-slate-500">{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</div>
      {sub ? <div className="text-[13px] leading-snug text-slate-500">{sub}</div> : null}
    </div>
  );
}

export function Meter({ value, className, label }: { value: number; className?: string; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-emerald-100", className)}
    >
      <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
