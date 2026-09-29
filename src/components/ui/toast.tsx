"use client";

import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error";
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, tone?: ToastItem["tone"]) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToast = create<ToastState>((set, get) => ({
  items: [],
  push: (message, tone = "success") => {
    const id = ++counter;
    set({ items: [...get().items, { id, message, tone }].slice(-3) });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}));

export function toast(message: string, tone: ToastItem["tone"] = "success") {
  useToast.getState().push(message, tone);
}

export function Toaster() {
  const items = useToast((s) => s.items);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex max-w-md animate-fade-up items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lift",
            t.tone === "success" ? "bg-slate-900 text-white" : "bg-rose-600 text-white",
          )}
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          )}
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Tutup notifikasi"
            className="-mr-1 rounded-lg p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
