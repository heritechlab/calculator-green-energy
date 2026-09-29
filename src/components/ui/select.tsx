import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "./styles";

/** Select native (paling ramah di ponsel) dengan gaya konsisten. */
export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function NativeSelect({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={cn(inputClass, "cursor-pointer appearance-none pr-10 font-medium", className)} {...props}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden
        />
      </div>
    );
  },
);
