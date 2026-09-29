"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Calculator, Menu, Sun } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/overlay";
import { Logo } from "./logo";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                isActive(item.href) ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/kalkulator">
              <Calculator className="h-4 w-4" aria-hidden />
              Mulai Hitung
            </Link>
          </Button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            side="right"
            title="Menu"
            trigger={
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            }
          >
            <nav aria-label="Navigasi seluler" className="flex flex-col gap-1">
              {[{ href: "/", label: "Beranda" }, ...siteConfig.nav].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "rounded-xl px-4 py-3 text-base font-semibold",
                    pathname === item.href ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white">
              <Sun className="h-6 w-6 text-amber-300" aria-hidden />
              <p className="mt-3 text-sm leading-relaxed text-emerald-50">
                Ketahui kebutuhan PLTS dan kapan investasi Anda kembali — gratis, tanpa daftar.
              </p>
              <Button asChild variant="white" className="mt-4 w-full">
                <Link href="/kalkulator" onClick={() => setOpen(false)}>
                  Mulai Hitung
                </Link>
              </Button>
            </div>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
