"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { RadioGroup, Switch as SwitchPrimitive, Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export interface Option<T extends string> {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

/** Kontrol segmen (radio) — pilihan tunggal dalam satu baris. */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  className,
  size = "md",
  ariaLabel,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={ariaLabel}
      orientation="horizontal"
      className={cn("grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-100 p-1", className)}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className={cn(
            "flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-center font-semibold text-slate-600 transition-all",
            "hover:text-slate-900 data-[state=checked]:bg-white data-[state=checked]:text-emerald-800 data-[state=checked]:shadow-sm data-[state=checked]:shadow-slate-900/10",
            "focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-50",
            size === "sm" ? "min-h-8 py-1 text-xs sm:text-sm" : "min-h-10 py-1.5 text-sm",
          )}
        >
          {o.icon}
          <span className="truncate">{o.label}</span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}

/** Kartu pilihan (radio) dengan deskripsi & ikon. */
export function ChoiceCards<T extends string>({
  value,
  onValueChange,
  options,
  className,
  ariaLabel,
  compact = false,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
  ariaLabel?: string;
  compact?: boolean;
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={ariaLabel}
      className={cn("grid gap-3", className)}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className={cn(
            "group relative flex h-full flex-col items-start gap-1.5 rounded-2xl border border-slate-200 bg-white text-left transition-all",
            "hover:border-emerald-300 hover:bg-emerald-50/40",
            "data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-50/70 data-[state=checked]:ring-4 data-[state=checked]:ring-emerald-500/10",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600",
            compact ? "p-3" : "p-4",
          )}
        >
          <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white transition-colors group-data-[state=checked]:border-emerald-600 group-data-[state=checked]:bg-emerald-600">
            <Check className="h-3 w-3 text-white opacity-0 group-data-[state=checked]:opacity-100" strokeWidth={3} aria-hidden />
          </span>
          {o.icon ? <span className="mb-1 text-emerald-700">{o.icon}</span> : null}
          <span className="pr-7 text-sm font-bold text-slate-900">{o.label}</span>
          {o.badge ? <span>{o.badge}</span> : null}
          {o.description ? <span className="text-[13px] leading-relaxed text-slate-500">{o.description}</span> : null}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  id,
  label,
  description,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-500">{description}</span> : null}
      </label>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 transition-colors data-[state=checked]:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
      </SwitchPrimitive.Root>
    </div>
  );
}

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  ariaLabel,
  className,
}: {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={(v) => onValueChange(v[0])}
      min={min}
      max={max}
      step={step}
      className={cn("relative flex h-8 w-full touch-none select-none items-center", className)}
    >
      <SliderPrimitive.Track className="relative h-2 grow overflow-hidden rounded-full bg-slate-200">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        className="block h-6 w-6 rounded-full border-2 border-emerald-600 bg-white shadow-md shadow-emerald-900/20 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
      />
    </SliderPrimitive.Root>
  );
}
