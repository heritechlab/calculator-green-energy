"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Popover } from "radix-ui";
import { cn } from "@/lib/utils";

/** Ikon info yang membuka penjelasan (tap di mobile, klik di desktop). */
export function InfoTip({ children, label = "Penjelasan" }: { children: React.ReactNode; label?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        aria-label={label}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-700"
      >
        <Info className="h-4 w-4" aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 max-w-[18rem] rounded-xl bg-slate-900 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-100 shadow-lg data-[state=open]:animate-fade-up"
        >
          {children}
          <Popover.Arrow className="fill-slate-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export interface FieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  info?: React.ReactNode;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
  /** Tampilan label sebagai legend untuk grup (radio/segmen). */
  asGroup?: boolean;
  aside?: React.ReactNode;
}

export function Field({ label, htmlFor, hint, info, error, className, children, asGroup, aside }: FieldProps) {
  const labelNode = (
    <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
      {label}
      {info ? <InfoTip label={`Penjelasan: ${typeof label === "string" ? label : "isian"}`}>{info}</InfoTip> : null}
    </span>
  );
  if (asGroup) {
    return (
      <fieldset className={cn("flex min-w-0 flex-col gap-2", className)}>
        <legend className="mb-2 flex w-full items-center justify-between gap-2">
          {labelNode}
          {aside}
        </legend>
        {children}
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        {hint && !error ? <p className="text-[13px] leading-relaxed text-slate-500">{hint}</p> : null}
      </fieldset>
    );
  }
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        {htmlFor ? <label htmlFor={htmlFor}>{labelNode}</label> : labelNode}
        {aside}
      </div>
      {children}
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      {hint && !error ? <p className="text-[13px] leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function SectionTitle({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {icon ? (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </span>
      ) : null}
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {description ? <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}
