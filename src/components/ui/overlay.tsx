"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";
import { Accordion as AccordionPrimitive, Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------

export function Accordion({
  items,
  defaultValue,
  className,
}: {
  items: { value: string; title: React.ReactNode; subtitle?: React.ReactNode; content: React.ReactNode }[];
  defaultValue?: string[];
  className?: string;
}) {
  return (
    <AccordionPrimitive.Root type="multiple" defaultValue={defaultValue} className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.value}
          value={item.value}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white data-[state=open]:border-emerald-200"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-600">
              <span>
                <span className="block text-sm font-semibold text-slate-800">{item.title}</span>
                {item.subtitle ? <span className="mt-0.5 block text-[13px] text-slate-500">{item.subtitle}</span> : null}
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="border-t border-slate-100 px-4 pt-4 pb-5">
            {item.content}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Dialog & Sheet
// ---------------------------------------------------------------------------

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  side,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  /** "right" untuk panel geser (menu mobile). */
  side?: "center" | "right";
  className?: string;
}) {
  const isSheet = side === "right";
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-fade-up" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 bg-white shadow-2xl focus:outline-none",
            isSheet
              ? "inset-y-0 right-0 flex w-[86vw] max-w-sm flex-col p-6"
              : "top-1/2 left-1/2 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 data-[state=open]:animate-fade-up",
            className,
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold text-slate-900">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-slate-500">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Tutup"
              className="-mt-1 -mr-2 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DialogClose = DialogPrimitive.Close;
