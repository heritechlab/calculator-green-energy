import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="sh-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#sh-bg)" />
      {/* Matahari */}
      <circle cx="27" cy="12.5" r="4.6" fill="#fbbf24" />
      <g stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round">
        <path d="M27 4.6v1.6M27 18.8v1.6M19.1 12.5h1.6M33.3 12.5h1.6M21.4 6.9l1.1 1.1M31.5 17l1.1 1.1M32.6 6.9l-1.1 1.1" />
      </g>
      {/* Panel surya */}
      <path d="M8.5 21.5h17.2l4.3 11H12.8z" fill="#ecfdf5" />
      <g stroke="#059669" strokeWidth="1.1">
        <path d="M11.2 25.1h16.3M13.4 28.8h15.7M14.3 21.5l2.2 11M20.1 21.5l2.2 11" />
      </g>
      {/* Daun */}
      <path d="M6.5 33.5c0-6 4-9.5 9.5-9.8-.4 5.7-3.9 9.6-9.5 9.8z" fill="#bef264" opacity=".95" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label={`${siteConfig.name} — beranda`}>
      <LogoMark className="transition-transform group-hover:-rotate-3" />
      <span className="flex flex-col leading-none">
        <span className={cn("text-lg font-extrabold tracking-tight", tone === "dark" ? "text-slate-900" : "text-white")}>
          Surya<span className={tone === "dark" ? "text-emerald-600" : "text-emerald-300"}>Hitung</span>
        </span>
        <span className={cn("mt-1 text-[10px] font-semibold tracking-[0.14em] uppercase", tone === "dark" ? "text-slate-500" : "text-emerald-200/80")}>
          {siteConfig.platform}
        </span>
      </span>
    </Link>
  );
}
