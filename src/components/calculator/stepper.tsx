"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS, type StepId, type WizardStepId } from "./steps-config";

export function Stepper({ current, onSelect }: { current: WizardStepId; onSelect: (id: StepId) => void }) {
  const index = WIZARD_STEPS.findIndex((s) => s.id === current);
  const step = WIZARD_STEPS[index];
  return (
    <nav aria-label="Langkah kalkulator">
      {/* Mobile: progres ringkas */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-emerald-700">
            Langkah {index + 1} dari {WIZARD_STEPS.length}
          </span>
          <span className="font-medium text-slate-500">{step.label}</span>
        </div>
        <ol className="mt-2 grid grid-cols-4 gap-1.5">
          {WIZARD_STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-label={`${s.label}${i === index ? " (langkah saat ini)" : ""}`}
                aria-current={i === index ? "step" : undefined}
                className="block w-full py-2"
              >
                <span className={cn("block h-1.5 rounded-full transition-colors", i <= index ? "bg-emerald-600" : "bg-slate-200")} />
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Desktop: langkah bernomor */}
      <ol className="hidden items-center gap-2 lg:flex">
        {WIZARD_STEPS.map((s, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-emerald-500 bg-white shadow-soft"
                    : "border-transparent hover:border-slate-200 hover:bg-white",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    active && "bg-emerald-600 text-white",
                    done && "bg-emerald-100 text-emerald-700",
                    !active && !done && "bg-slate-100 text-slate-500",
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Langkah {i + 1}</span>
                  <span className={cn("block truncate text-sm font-bold", active ? "text-slate-900" : "text-slate-600")}>
                    {s.label}
                  </span>
                </span>
              </button>
              {i < WIZARD_STEPS.length - 1 ? <span className="h-px w-4 shrink-0 bg-slate-300" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
