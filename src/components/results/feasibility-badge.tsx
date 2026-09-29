import { AlertTriangle, CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { FEASIBILITY_LABELS, type FeasibilityLevel } from "@/lib/engine";
import { cn } from "@/lib/utils";

const STYLES: Record<FeasibilityLevel, { className: string; Icon: typeof CheckCircle2 }> = {
  "sangat-layak": { className: "bg-emerald-50 text-emerald-800 ring-emerald-600/25", Icon: CheckCircle2 },
  layak: { className: "bg-lime-50 text-lime-900 ring-lime-600/30", Icon: CheckCircle2 },
  "kurang-layak": { className: "bg-amber-50 text-amber-900 ring-amber-600/30", Icon: CircleAlert },
  "tidak-layak": { className: "bg-rose-50 text-rose-800 ring-rose-600/25", Icon: XCircle },
};

/** Status kelayakan: selalu ikon + label (tidak hanya warna). */
export function FeasibilityBadge({ level, className, onDark }: { level: FeasibilityLevel; className?: string; onDark?: boolean }) {
  const { className: tone, Icon } = STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset",
        onDark ? "bg-white text-slate-900 ring-white/20" : tone,
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", onDark && (level === "tidak-layak" ? "text-rose-600" : level === "kurang-layak" ? "text-amber-600" : "text-emerald-600"))} aria-hidden />
      {FEASIBILITY_LABELS[level]}
    </span>
  );
}

export function WarningIcon({ level }: { level: "info" | "warning" | "danger" }) {
  if (level === "danger") return <XCircle className="h-5 w-5 shrink-0 text-rose-600" aria-hidden />;
  if (level === "warning") return <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />;
  return <CircleAlert className="h-5 w-5 shrink-0 text-sky-600" aria-hidden />;
}
