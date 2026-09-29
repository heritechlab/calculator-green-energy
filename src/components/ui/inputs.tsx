"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDecimal, parseLocaleNumber } from "@/lib/format";
import { inputClass } from "./styles";

export { inputClass };

function Adornment({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500",
        side === "left" ? "left-3.5" : "right-3.5",
      )}
    >
      {children}
    </span>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClass, className)} {...props} />;
  },
);

const formatThousands = (n: number) => Math.round(n).toLocaleString("id-ID");

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "prefix"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  prefix?: string;
  suffix?: string;
}

/** Input Rupiah dengan pemisah ribuan otomatis (mempertahankan posisi kursor). */
export function CurrencyInput({ value, onValueChange, prefix = "Rp", suffix, className, ...props }: CurrencyInputProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState(value === null ? "" : formatThousands(value));
  const [prevValue, setPrevValue] = React.useState(value);
  const caretDigits = React.useRef<number | null>(null);

  // Sinkronkan dengan perubahan nilai dari luar (pola "derived state").
  if (value !== prevValue) {
    setPrevValue(value);
    const current = text.replace(/\D/g, "");
    const external = value === null ? "" : String(Math.round(value));
    if (current !== external) setText(value === null ? "" : formatThousands(value));
  }

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || caretDigits.current === null || document.activeElement !== el) return;
    let digits = 0;
    let pos = 0;
    while (pos < text.length && digits < caretDigits.current) {
      if (/\d/.test(text[pos])) digits++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
    caretDigits.current = null;
  }, [text]);

  return (
    <div className="relative">
      <Adornment side="left">{prefix}</Adornment>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={cn(inputClass, "pl-11 font-semibold tabular", suffix && "pr-16", className)}
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          const caret = e.target.selectionStart ?? raw.length;
          caretDigits.current = raw.slice(0, caret).replace(/\D/g, "").length;
          const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
          setText(digits ? formatThousands(Number(digits)) : "");
          onValueChange(digits ? Number(digits) : null);
        }}
        {...props}
      />
      {suffix ? <Adornment side="right">{suffix}</Adornment> : null}
    </div>
  );
}

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Jumlah desimal maksimum saat ditampilkan. */
  decimals?: number;
  suffix?: string;
  prefix?: string;
  allowEmpty?: boolean;
}

/** Input angka desimal gaya Indonesia (koma sebagai desimal), dengan satuan. */
export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  decimals = 2,
  suffix,
  prefix,
  allowEmpty = false,
  className,
  onBlur,
  onFocus,
  ...props
}: NumberInputProps) {
  const format = React.useCallback((v: number | null) => (v === null ? "" : formatDecimal(v, decimals)), [decimals]);
  const [text, setText] = React.useState(format(value));
  const [focused, setFocused] = React.useState(false);
  const [prevValue, setPrevValue] = React.useState(value);

  // Perbarui teks bila nilai berubah dari luar (bukan saat pengguna sedang mengetik).
  if (value !== prevValue) {
    setPrevValue(value);
    if (!focused) setText(format(value));
  }

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

  return (
    <div className="relative">
      {prefix ? <Adornment side="left">{prefix}</Adornment> : null}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn(inputClass, "font-semibold tabular", prefix && "pl-11", suffix && "pr-20", className)}
        value={text}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9,.-]/g, "");
          setText(raw);
          if (!raw.trim()) {
            if (allowEmpty) onValueChange(null);
            return;
          }
          const n = parseLocaleNumber(raw.includes(",") ? raw : raw.replace(/\.(?=\d{1,2}$)/, ","));
          if (n !== null) onValueChange(n);
        }}
        onBlur={(e) => {
          setFocused(false);
          const n = text.trim() ? parseLocaleNumber(text.includes(",") ? text : text.replace(/\.(?=\d{1,2}$)/, ",")) : null;
          if (n === null) {
            if (allowEmpty && !text.trim()) {
              onValueChange(null);
              setText("");
            } else {
              setText(format(value));
            }
          } else {
            const c = clamp(n);
            onValueChange(c);
            setText(format(c));
          }
          onBlur?.(e);
        }}
        {...props}
      />
      {suffix ? <Adornment side="right">{suffix}</Adornment> : null}
    </div>
  );
}
