"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-700">
        <AlertTriangle className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold text-slate-900">Terjadi kendala</h1>
      <p className="mt-2 leading-relaxed text-slate-600">
        Maaf, halaman ini gagal dimuat. Coba lagi — bila masih bermasalah, layanan penyimpanan mungkin sedang tidak tersedia.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Coba lagi</Button>
        <Button asChild variant="outline">
          <Link href="/kalkulator">Buka kalkulator</Link>
        </Button>
      </div>
    </div>
  );
}
