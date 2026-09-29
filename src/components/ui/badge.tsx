import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  lime: "bg-lime-50 text-lime-800 ring-lime-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/25",
  red: "bg-rose-50 text-rose-800 ring-rose-600/20",
  sky: "bg-sky-50 text-sky-800 ring-sky-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/15",
  white: "bg-white/15 text-white ring-white/25",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "green", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
