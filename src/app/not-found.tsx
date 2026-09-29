import Link from "next/link";
import { SunDim } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
        <SunDim className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-2 leading-relaxed text-slate-600">
        Tautan mungkin salah ketik atau laporan yang Anda cari sudah tidak tersedia.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/kalkulator">Buka kalkulator</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
