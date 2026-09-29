import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-emerald-600 text-white shadow-sm shadow-emerald-900/15 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-600/50",
  secondary: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200",
  outline: "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  sun: "bg-amber-400 text-amber-950 shadow-sm shadow-amber-900/20 hover:bg-amber-300 active:bg-amber-500",
  white: "bg-white text-emerald-800 shadow-sm hover:bg-emerald-50",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
} as const;

const sizes = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-6 text-base",
  icon: "h-10 w-10 rounded-xl",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-semibold whitespace-nowrap transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
