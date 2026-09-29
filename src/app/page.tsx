import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BatteryCharging,
  Building2,
  Car,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  Gauge,
  Home as HomeIcon,
  Leaf,
  MapPin,
  Receipt,
  Scale,
  Share2,
  ShieldCheck,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import { DATASET_STATS } from "@/lib/data/locations";
import { TARIFFS } from "@/lib/data/tariffs";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickEstimate } from "@/components/landing/quick-estimate";
import { FaqList } from "@/components/landing/faq";

const steps = [
  {
    icon: MapPin,
    title: "Pilih lokasi & atap",
    text: "Radiasi matahari tiap kota berbeda. Kami memakai data per lokasi, kemiringan, dan arah atap Anda.",
  },
  {
    icon: Receipt,
    title: "Masukkan tagihan listrik",
    text: "Cukup tagihan bulanan dan golongan PLN. Pola pemakaian siang/malam membuat hasilnya realistis.",
  },
  {
    icon: BarChart3,
    title: "Dapatkan rekomendasi",
    text: "Kapasitas optimal, biaya, penghematan, balik modal, hingga arus kas 25 tahun — siap dibagikan.",
  },
];

const features = [
  {
    icon: Gauge,
    title: "Simulasi per jam",
    text: "Produksi panel dicocokkan dengan pola pemakaian 24 jam untuk tiap bulan — bukan sekadar rata-rata.",
  },
  {
    icon: ShieldCheck,
    title: "Sesuai aturan terbaru",
    text: "Mengikuti Permen ESDM 2/2024: surplus ke PLN tidak mengurangi tagihan, jadi ukuran sistem dioptimalkan.",
  },
  {
    icon: Scale,
    title: "Analisis finansial lengkap",
    text: "Payback, NPV, IRR, ROI, LCOE, simulasi cicilan, hingga analisis sensitivitas harga & tarif.",
  },
  {
    icon: BatteryCharging,
    title: "On-grid, hybrid, off-grid",
    text: "Bandingkan ketiga jenis sistem sekaligus, termasuk kebutuhan baterai dan cadangan saat padam.",
  },
  {
    icon: Leaf,
    title: "Dampak lingkungan",
    text: "Lihat emisi CO₂ yang dihindari dan porsi energi hijau dalam kebutuhan listrik Anda.",
  },
  {
    icon: Share2,
    title: "Simpan, bagikan, cetak",
    text: "Tautan hasil untuk keluarga atau partner, plus laporan siap cetak/PDF untuk proposal.",
  },
];

const systems = [
  {
    icon: Zap,
    name: "On-Grid",
    tag: "Paling hemat",
    text: "Terhubung PLN tanpa baterai. Investasi terendah, cocok bila pemakaian siang cukup besar.",
  },
  {
    icon: BatteryCharging,
    name: "Hybrid",
    tag: "Ada cadangan",
    text: "Terhubung PLN + baterai. Surplus siang dipakai malam dan tetap menyala saat PLN padam.",
  },
  {
    icon: Sun,
    name: "Off-Grid",
    tag: "Mandiri",
    text: "Tanpa PLN sama sekali. Cocok untuk lokasi terpencil atau yang ingin mandiri energi.",
  },
];

const upcoming = [
  { icon: Wind, name: "PLTB skala kecil" },
  { icon: Flame, name: "Biogas rumah tangga" },
  { icon: Sun, name: "Pemanas air surya" },
  { icon: Car, name: "Kendaraan listrik" },
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    inLanguage: "id-ID",
    description: siteConfig.description,
    url: siteConfig.url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div className="bg-grid-faint absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" aria-hidden />
        <div className="absolute -top-48 -right-40 h-[560px] w-[560px] rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-48 -left-40 h-[480px] w-[480px] rounded-full bg-emerald-500/25 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
          <div className="animate-fade-up">
            <Badge tone="white" className="px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Sesuai aturan PLTS atap Permen ESDM 2/2024
            </Badge>
            <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              Hitung kebutuhan PLTS &amp; <span className="text-amber-300">balik modal</span> Anda dalam 2 menit
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-emerald-100/90 sm:text-lg">
              Kalkulator panel surya atap yang lengkap namun mudah: berapa kWp yang dibutuhkan, berapa biayanya, hemat
              berapa per bulan, dan kapan investasi kembali — dihitung dengan data matahari kota Anda.
            </p>
            <ul className="mt-6 grid gap-2.5 text-sm text-emerald-50 sm:grid-cols-2">
              {[
                `Radiasi matahari ${DATASET_STATS.cities}+ kota`,
                `${TARIFFS.length} golongan tarif PLN terbaru`,
                "Simulasi produksi per jam",
                "NPV, IRR, arus kas 25 tahun",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-lime-300" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="sun">
                <Link href="/kalkulator">
                  Mulai hitung detail <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
                <Link href="/panduan">Pelajari PLTS atap</Link>
              </Button>
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:120ms]">
            <QuickEstimate />
          </div>
        </div>
      </section>

      {/* Angka kunci */}
      <section aria-label="Fakta kunci" className="border-b border-emerald-100 bg-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-8 sm:px-6 lg:grid-cols-4">
          {[
            { k: "4,5–6 kWh/m²", v: "radiasi matahari harian di Indonesia" },
            { k: "Rp1.445–1.700", v: "tarif PLN rumah tangga per kWh" },
            { k: "25+ tahun", v: "umur pakai panel surya" },
            { k: "0,84 kg CO₂", v: "emisi per kWh listrik grid Jawa–Bali" },
          ].map((s) => (
            <div key={s.k} className="px-3 py-3 text-center sm:px-4">
              <dt className="text-xl font-extrabold tracking-tight text-emerald-800 sm:text-2xl">{s.k}</dt>
              <dd className="mt-1 text-[13px] leading-snug text-slate-500">{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Cara kerja */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-wide text-emerald-700 uppercase">Cara kerja</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Tiga langkah menuju atap yang menghasilkan listrik</h2>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
              <span className="absolute top-6 right-6 text-5xl font-extrabold text-emerald-100" aria-hidden>
                {i + 1}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-900/20">
                <s.icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Fitur */}
      <section className="bg-mint/70">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-wide text-emerald-700 uppercase">Kenapa {siteConfig.name}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Detail seperti konsultan, semudah kalkulator</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Semua asumsi terbuka dan bisa diubah. Tidak ada angka ajaib — Anda bisa melihat bagaimana setiap rupiah
              penghematan dihitung.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-3xl bg-white p-6 ring-1 ring-emerald-900/5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <f.icon className="h-5.5 w-5.5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulasi */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-800 to-forest p-7 text-white sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <Badge tone="white">Aturan baru</Badge>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Surplus listrik ke PLN kini tidak mengurangi tagihan</h2>
            <p className="mt-3 text-sm leading-relaxed text-emerald-50/90 sm:text-base">
              Sejak Permen ESDM No. 2 Tahun 2024, skema ekspor–impor dihapus. Panel yang terlalu besar justru membuang
              listrik gratis ke jaringan. Karena itu {siteConfig.name} mencocokkan produksi panel dengan jam pemakaian
              Anda, lalu mencari ukuran dengan nilai ekonomi terbaik.
            </p>
            <Button asChild variant="white" className="mt-6">
              <Link href="/panduan#regulasi">
                Baca ringkasan regulasi <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              "Kapasitas mengikuti kuota PLTS atap per wilayah (tidak lagi dibatasi 100% daya)",
              "Tidak ada biaya kapasitas (capacity charge)",
              "Pelanggan PLTS atap menjadi pelanggan pascabayar",
              "Pengajuan melalui PLN sesuai jadwal kuota",
            ].map((t) => (
              <li key={t} className="flex gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lime-300" aria-hidden />
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Jenis sistem */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-wide text-emerald-700 uppercase">Jenis sistem</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">On-grid, hybrid, atau off-grid?</h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">Kalkulator membandingkan ketiganya secara otomatis untuk pemakaian Anda.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {systems.map((s) => (
            <div key={s.name} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <s.icon className="h-5.5 w-5.5" aria-hidden />
                </span>
                <Badge tone="green">{s.tag}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">PLTS {s.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Untuk siapa */}
      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            { icon: HomeIcon, title: "Rumah tangga", text: "Ketahui ukuran yang pas dan hindari membayar panel yang listriknya terbuang." },
            { icon: Building2, title: "Bisnis & industri", text: "NPV, IRR, LCOE, dan arus kas tahunan untuk keputusan investasi dan pengajuan kredit." },
            { icon: FileText, title: "Installer & konsultan", text: "Estimasi cepat dengan harga Anda sendiri, lengkap dengan laporan siap dibagikan." },
          ].map((c) => (
            <div key={c.title} className="flex gap-4 rounded-3xl p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <c.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{c.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-center text-sm font-bold tracking-wide text-emerald-700 uppercase">Pertanyaan umum</p>
        <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Yang sering ditanyakan</h2>
        <FaqList limit={5} className="mt-10" />
        <p className="mt-6 text-center text-sm">
          <Link href="/panduan#faq" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Lihat semua pertanyaan →
          </Link>
        </p>
      </section>

      {/* Energi hijau lain */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-[2rem] border border-dashed border-emerald-300 bg-emerald-50/50 p-7 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-bold tracking-wide text-emerald-700 uppercase">{siteConfig.platform}</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">PLTS adalah langkah pertama</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Modul energi hijau lainnya sedang disiapkan agar Anda bisa merencanakan rumah dan usaha yang lebih bersih.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {upcoming.map((u) => (
                <li key={u.name} className="flex flex-col items-center gap-2 rounded-2xl bg-white px-4 py-4 text-center text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                  <u.icon className="h-5 w-5 text-emerald-600" aria-hidden />
                  {u.name}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Segera</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA akhir */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-12 text-center text-white shadow-lift">
          <Clock3 className="h-8 w-8 text-amber-300" aria-hidden />
          <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            Dua menit sekarang bisa menghemat jutaan rupiah per tahun
          </h2>
          <Button asChild size="lg" variant="sun">
            <Link href="/kalkulator">
              Hitung kebutuhan PLTS saya <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
