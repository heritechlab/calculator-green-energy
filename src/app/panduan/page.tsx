import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  FileCheck2,
  Gauge,
  Hammer,
  LayoutGrid,
  PlugZap,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/landing/faq";

export const metadata: Metadata = {
  title: "Panduan PLTS Atap — Jenis Sistem, Regulasi & Langkah Pemasangan",
  description:
    "Panduan lengkap PLTS atap di Indonesia: komponen, on-grid vs hybrid vs off-grid, aturan Permen ESDM No. 2 Tahun 2024, langkah pemasangan, tips memilih installer, dan perawatan.",
  alternates: { canonical: "/panduan" },
};

const TOC = [
  { id: "apa-itu", label: "Apa itu PLTS atap" },
  { id: "jenis", label: "Jenis sistem" },
  { id: "regulasi", label: "Regulasi terbaru" },
  { id: "langkah", label: "Langkah pemasangan" },
  { id: "installer", label: "Memilih installer" },
  { id: "perawatan", label: "Perawatan" },
  { id: "faq", label: "FAQ" },
];

const components = [
  {
    icon: LayoutGrid,
    name: "Panel surya",
    text: "Mengubah cahaya matahari menjadi listrik DC. Umumnya 450–700 Wp per panel, bergaransi kinerja 25–30 tahun.",
  },
  {
    icon: Cpu,
    name: "Inverter",
    text: "Mengubah listrik DC menjadi AC yang dipakai di rumah. Inverter hybrid juga mengatur pengisian baterai.",
  },
  {
    icon: Hammer,
    name: "Struktur dudukan",
    text: "Rangka aluminium/baja ringan yang mengikat panel ke atap genteng, metal, atau dak beton.",
  },
  {
    icon: ShieldCheck,
    name: "Proteksi & kabel",
    text: "MCB/fuse DC & AC, SPD (penangkal surja), grounding, dan kabel khusus surya (PV cable).",
  },
  {
    icon: Gauge,
    name: "Meter & monitoring",
    text: "PLN memasang meter untuk pelanggan PLTS atap; inverter modern menyediakan aplikasi pemantau produksi.",
  },
  {
    icon: BatteryCharging,
    name: "Baterai (opsional)",
    text: "LiFePO4 untuk sistem hybrid/off-grid: menyimpan surplus siang dan menjadi cadangan saat padam.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Hitung & survei",
    text: "Gunakan kalkulator untuk estimasi awal, lalu minta installer melakukan survei atap (kekuatan struktur, bayangan, arah).",
  },
  {
    icon: ClipboardCheck,
    title: "Desain & penawaran",
    text: "Bandingkan minimal 2–3 penawaran: kapasitas (kWp), merek & garansi komponen, estimasi produksi, serta jadwal.",
  },
  {
    icon: FileCheck2,
    title: "Pengajuan ke PLN",
    text: "Pengajuan PLTS atap mengikuti kuota wilayah dan jadwal yang diumumkan PLN. Installer biasanya membantu dokumennya.",
  },
  {
    icon: Hammer,
    title: "Instalasi",
    text: "Pemasangan rumah tangga umumnya 1–3 hari. Pastikan instalasi sesuai standar (PUIL) dan memakai proteksi lengkap.",
  },
  {
    icon: PlugZap,
    title: "Pemeriksaan & meter",
    text: "Sistem diperiksa; untuk sistem yang wajib, diterbitkan Sertifikat Laik Operasi (SLO). PLN kemudian memasang meter.",
  },
  {
    icon: Sparkles,
    title: "Beroperasi",
    text: "Pantau produksi lewat aplikasi, geser pemakaian besar (mesin cuci, pompa, AC) ke siang hari agar penghematan maksimal.",
  },
];

export default function GuidePage() {
  return (
    <div>
      <section className="bg-forest-deep text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-bold tracking-wide text-emerald-300 uppercase">Panduan</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Semua yang perlu Anda ketahui sebelum memasang PLTS atap
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-100/90">
            Dari cara kerja panel surya, memilih jenis sistem, aturan PLTS atap terbaru, hingga tips memilih installer — ditulis
            ringkas dan mudah dipahami.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Daftar isi" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-sm">
            {TOC.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="block rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white hover:text-emerald-800"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="flex min-w-0 flex-col gap-16 text-slate-700">
          <section id="apa-itu" className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Apa itu PLTS atap?</h2>
            <p className="mt-3 max-w-3xl leading-relaxed">
              PLTS (Pembangkit Listrik Tenaga Surya) atap adalah panel surya yang dipasang di atap bangunan untuk menghasilkan
              listrik sendiri. Di Indonesia, setiap 1 kWp panel menghasilkan sekitar <strong>1.250–1.750 kWh per tahun</strong>{" "}
              tergantung lokasi — tertinggi di Nusa Tenggara dan Sulawesi, lebih rendah di daerah bercurah hujan tinggi.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {components.map((c) => (
                <div key={c.name} className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <c.icon className="h-6 w-6 text-emerald-600" aria-hidden />
                  <h3 className="mt-3 font-bold text-slate-900">{c.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="jenis" className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">On-grid, hybrid, atau off-grid?</h2>
            <div className="scroll-thin mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Aspek
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      On-grid
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Hybrid
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Off-grid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Terhubung PLN", "Ya", "Ya", "Tidak"],
                    ["Baterai", "Tidak", "Ya (sedang)", "Ya (besar)"],
                    ["Saat PLN padam", "Ikut padam (proteksi anti-islanding)", "Tetap menyala dari baterai", "Tidak terpengaruh"],
                    ["Investasi", "Terendah", "Menengah–tinggi", "Tertinggi"],
                    [
                      "Cocok untuk",
                      "Pemakaian siang besar, ingin balik modal cepat",
                      "Sering padam, pemakaian malam besar",
                      "Lokasi tanpa jaringan PLN",
                    ],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <th scope="row" className="px-4 py-3 font-semibold text-slate-900">
                        {row[0]}
                      </th>
                      {row.slice(1).map((c, i) => (
                        <td key={i} className="px-4 py-3">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="regulasi" className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Aturan PLTS atap terbaru</h2>
            <p className="mt-3 max-w-3xl leading-relaxed">
              PLTS atap yang terhubung ke jaringan PLN diatur dalam <strong>Peraturan Menteri ESDM Nomor 2 Tahun 2024</strong>.
              Beberapa poin penting yang memengaruhi perhitungan:
            </p>
            <ul className="mt-5 grid gap-3">
              {[
                [
                  "Tidak ada kompensasi ekspor",
                  "Kelebihan listrik yang mengalir ke jaringan PLN tidak lagi mengurangi tagihan (skema ekspor–impor/net-metering dihapus). PLTS diarahkan untuk konsumsi sendiri.",
                ],
                [
                  "Kapasitas mengikuti kuota",
                  "Kapasitas tidak lagi dibatasi 100% daya tersambung secara individu, tetapi mengikuti kuota pengembangan PLTS atap per sistem/klaster yang ditetapkan PLN.",
                ],
                [
                  "Tanpa biaya kapasitas",
                  "Biaya kapasitas (capacity charge) yang sebelumnya dikenakan pada pelanggan tertentu dihapus.",
                ],
                [
                  "Pelanggan pascabayar",
                  "Pelanggan PLTS atap adalah pelanggan pascabayar, sehingga berlaku rekening minimum (40 jam nyala).",
                ],
                [
                  "Sertifikat Laik Operasi",
                  "Sistem dengan kapasitas/spesifikasi tertentu wajib memiliki SLO sebelum beroperasi.",
                ],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  <span>
                    <strong className="block text-slate-900">{t}</strong>
                    <span className="text-sm leading-relaxed">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-200">
              <strong>Artinya bagi Anda:</strong> jangan membeli panel sebanyak-banyaknya. Ukuran ideal mengikuti pemakaian siang
              hari — kalkulator kami mensimulasikan hal ini per jam dan mencari kapasitas dengan nilai ekonomi terbaik. Ketentuan
              teknis dan jadwal kuota dapat berubah; selalu konfirmasi ke PLN setempat.
            </p>
          </section>

          <section id="langkah" className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Langkah pemasangan</h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <strong className="flex items-center gap-2 text-slate-900">
                      <s.icon className="h-4 w-4 text-emerald-600" aria-hidden /> {s.title}
                    </strong>
                    <span className="mt-1 block text-sm leading-relaxed">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section id="installer" className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Tips memilih installer & membaca penawaran
            </h2>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {[
                "Minta rincian: merek & tipe panel/inverter, jumlah panel, kWp, dan estimasi produksi tahunan.",
                "Bandingkan harga per kWp (total ÷ kWp) — gunakan fitur “harga penawaran installer” di kalkulator.",
                "Periksa garansi: produk panel 10–15 th, kinerja 25–30 th, inverter 5–10 th, dan garansi pemasangan.",
                "Pastikan ada proteksi lengkap (DC/AC breaker, SPD, grounding) dan kabel PV bersertifikat.",
                "Tanyakan pengalaman proyek, sertifikasi tenaga ahli, dan layanan purna jual di kota Anda.",
                "Waspadai janji balik modal yang terlalu cepat atau asumsi net-metering yang sudah tidak berlaku.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 rounded-xl bg-white p-4 text-sm leading-relaxed ring-1 ring-slate-200/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </section>

          <section id="perawatan" className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Perawatan</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Sun,
                  t: "Bersihkan panel",
                  d: "Setiap 1–3 bulan (lebih sering di musim kemarau/daerah berdebu) dengan air bersih dan sikat lembut.",
                },
                {
                  icon: Zap,
                  t: "Pantau produksi",
                  d: "Bandingkan produksi harian di aplikasi inverter. Penurunan mendadak bisa menandakan kotoran, bayangan baru, atau gangguan.",
                },
                {
                  icon: Wrench,
                  t: "Inspeksi berkala",
                  d: "Periksa kabel, konektor, dan dudukan setahun sekali. Anggarkan penggantian inverter sekitar tahun ke-10 s.d. 15.",
                },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <c.icon className="h-6 w-6 text-emerald-600" aria-hidden />
                  <h3 className="mt-3 font-bold text-slate-900">{c.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="faq" className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Pertanyaan umum</h2>
            <FaqList className="mt-6" />
          </section>

          <div className="flex flex-col items-start gap-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Siap menghitung kebutuhan Anda?</h2>
              <p className="mt-1 text-sm text-emerald-50">Dapatkan kapasitas, biaya, dan balik modal dalam 2 menit.</p>
            </div>
            <Button asChild variant="sun" size="lg">
              <Link href="/kalkulator">
                Buka kalkulator <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
