import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const FAQS: { q: string; a: string }[] = [
  {
    q: "Berapa kapasitas PLTS yang saya butuhkan?",
    a: "Tergantung pemakaian listrik, pola pemakaian siang/malam, dan radiasi matahari di kota Anda. Sebagai gambaran, 1 kWp di Jawa menghasilkan ±1.300–1.500 kWh per tahun (±110–125 kWh/bulan). Karena surplus ke PLN tidak lagi mengurangi tagihan, ukuran ideal biasanya mengikuti pemakaian siang hari — kalkulator mencarinya otomatis.",
  },
  {
    q: "Berapa biaya pasang PLTS atap di Indonesia?",
    a: "Kisaran umum 2025–2026 untuk sistem on-grid terpasang: ±Rp13–19 juta per kWp untuk rumah tangga (makin besar makin murah per kWp) dan ±Rp8–13 juta per kWp untuk komersial/industri. Sistem hybrid memerlukan tambahan baterai (±Rp4–6 juta per kWh). Anda bisa memasukkan harga penawaran installer di kalkulator.",
  },
  {
    q: "Berapa lama balik modal PLTS?",
    a: "Untuk pelanggan nonsubsidi dengan pemakaian siang yang cukup, umumnya 5–10 tahun, sementara panel bertahan 25 tahun lebih. Tarif bersubsidi (450 VA dan 900 VA subsidi) membuat balik modal jauh lebih lama.",
  },
  {
    q: "Apakah kelebihan listrik bisa dijual ke PLN?",
    a: "Tidak lagi. Menurut Permen ESDM No. 2 Tahun 2024, energi yang masuk ke jaringan PLN tidak diperhitungkan dalam tagihan. Karena itu, PLTS diarahkan untuk konsumsi sendiri, atau surplus disimpan di baterai (sistem hybrid).",
  },
  {
    q: "Apa bedanya on-grid, hybrid, dan off-grid?",
    a: "On-grid terhubung PLN tanpa baterai — paling murah, tetapi ikut padam saat PLN padam. Hybrid terhubung PLN dan memiliki baterai untuk malam hari atau saat padam. Off-grid sepenuhnya mandiri tanpa PLN dan membutuhkan baterai besar.",
  },
  {
    q: "Apakah perlu izin untuk memasang PLTS atap?",
    a: "Ya, untuk PLTS atap yang terhubung ke jaringan PLN. Pengajuan dilakukan ke PLN sesuai kuota wilayah, lalu sistem diperiksa dan meter diganti oleh PLN. Sistem tertentu wajib memiliki Sertifikat Laik Operasi (SLO). Installer bersertifikat biasanya membantu seluruh prosesnya.",
  },
  {
    q: "Seberapa akurat hasil kalkulator ini?",
    a: "Model kami mensimulasikan produksi per jam berdasarkan posisi matahari, radiasi, suhu, dan susut sistem, dengan akurasi produksi tahunan umumnya dalam ±10%. Hasil tetap estimasi — survei lokasi (bayangan, kondisi atap) dan penawaran resmi installer tetap diperlukan.",
  },
  {
    q: "Bagaimana perawatan panel surya?",
    a: "Relatif ringan: bersihkan debu/kotoran permukaan panel secara berkala (terutama di musim kemarau), periksa kabel dan inverter, dan pantau produksi lewat aplikasi inverter. Inverter umumnya perlu diganti sekali dalam 10–15 tahun.",
  },
];

/** Daftar FAQ berbasis <details> (tanpa JavaScript, ramah SEO & aksesibel). */
export function FaqList({ limit, className }: { limit?: number; className?: string }) {
  const items = limit ? FAQS.slice(0, limit) : FAQS;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((f) => (
        <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white open:border-emerald-200 open:shadow-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
