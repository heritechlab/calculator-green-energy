"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, History, Pencil, Printer, Share2, Trash2 } from "lucide-react";
import { SYSTEM_LABELS, type CalculationResult, type SystemType } from "@/lib/engine";
import { formatKwp, formatRupiahCompact, formatYears } from "@/lib/format";
import { useExtras } from "@/hooks/use-calculation";
import { useCalculatorStore } from "@/store/calculator";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CashflowChart, SensitivityTornado, SizingCharts } from "./charts/finance-charts";
import { DailyProfileChart, MonthlyEnergyCharts } from "./charts/energy-charts";
import { AssumptionsList, CashflowTable, ComparisonTable, LoanCard, SizingOptionsList } from "./detail-sections";
import { SectionNav } from "./section-nav";
import { ShareDialog } from "./share-dialog";
import {
  BillCard,
  CapexCard,
  EnergyStats,
  EnvironmentCard,
  FinanceStats,
  GreenNeedsCard,
  ResultHero,
  SystemSpecCard,
  WarningsList,
} from "./summary-sections";
import type { StepId } from "@/components/calculator/steps-config";

const SECTIONS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "energi", label: "Energi" },
  { id: "keuangan", label: "Keuangan" },
  { id: "ukuran", label: "Pilihan ukuran" },
  { id: "bandingkan", label: "Bandingkan" },
  { id: "lingkungan", label: "Lingkungan" },
  { id: "asumsi", label: "Asumsi" },
];

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32">
      <div className="mb-4">
        <h2 id={`${id}-title`} className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** Buka <details data-print-open> saat mencetak agar tabel ikut tercetak. */
function usePrintExpand() {
  useEffect(() => {
    const opened: HTMLDetailsElement[] = [];
    const before = () => {
      document.querySelectorAll<HTMLDetailsElement>("details[data-print-open]").forEach((d) => {
        if (!d.open) {
          d.open = true;
          opened.push(d);
        }
      });
    };
    const after = () => {
      opened.splice(0).forEach((d) => (d.open = false));
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
}

function formatDateId(time: number): string {
  return new Date(time).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

const noopSubscribe = () => () => {};
/** Tanggal hari ini (kosong saat render server agar tidak terjadi hydration mismatch). */
function useToday(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => formatDateId(Date.now()),
    () => "",
  );
}

export interface ReportMeta {
  id: string;
  title: string | null;
  createdAt: number;
  viewCount: number;
}

export function ResultsView({
  result,
  context,
  onEdit,
  report,
}: {
  result: CalculationResult;
  context: "calculator" | "report";
  onEdit?: (step: StepId) => void;
  report?: ReportMeta;
}) {
  const router = useRouter();
  const extras = useExtras(result);
  const update = useCalculatorStore((s) => s.update);
  const setInput = useCalculatorStore((s) => s.setInput);
  const history = useCalculatorStore((s) => s.history);
  const removeHistory = useCalculatorStore((s) => s.removeHistory);
  usePrintExpand();

  const editable = context === "calculator";
  const ev = result.evaluation;
  const lifetime = result.input.finance.lifetimeYears;

  const applySize = (kwp: number) => {
    update("system", { sizingMode: "manual", manualKwp: Math.round(kwp * 1000) / 1000 });
    toast(`Kapasitas diubah ke ${formatKwp(kwp)}`);
  };
  const switchType = (type: SystemType) => {
    update("system", { type, sizingMode: "optimal" });
    toast(`Dihitung ulang sebagai PLTS ${SYSTEM_LABELS[type]}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const copyToCalculator = () => {
    setInput(result.input);
    toast("Data disalin ke kalkulator Anda");
    router.push("/kalkulator?step=hasil");
  };

  const today = useToday();
  const dateLabel = report ? formatDateId(report.createdAt) : today;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
      {/* Kop khusus cetak */}
      <div className="mb-6 hidden items-center justify-between border-b border-slate-300 pb-3 print:flex">
        <p className="text-lg font-extrabold">
          {siteConfig.name} <span className="font-medium text-slate-500">— Laporan Estimasi PLTS</span>
        </p>
        <p className="text-sm text-slate-500">{dateLabel}</p>
      </div>

      {report ? (
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
          <p className="text-slate-600">
            <span className="font-bold text-slate-900">{report.title ?? "Laporan tersimpan"}</span> · dibuat {dateLabel} · dilihat{" "}
            {report.viewCount}×
          </p>
          <Button size="sm" onClick={copyToCalculator}>
            <Copy className="h-4 w-4" aria-hidden /> Ubah di kalkulator saya
          </Button>
        </div>
      ) : null}

      <ResultHero result={result} />

      <div className="no-print mt-4 flex flex-wrap gap-2">
        {editable ? (
          <ShareDialog
            result={result}
            trigger={
              <Button>
                <Share2 className="h-4 w-4" aria-hidden /> Simpan & bagikan
              </Button>
            }
          />
        ) : null}
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden /> Cetak / PDF
        </Button>
        {editable && onEdit ? (
          <Button variant="outline" onClick={() => onEdit("lokasi")}>
            <Pencil className="h-4 w-4" aria-hidden /> Ubah data
          </Button>
        ) : null}
        {!editable ? (
          <Button asChild variant="outline">
            <Link href="/kalkulator">Hitung untuk lokasi saya</Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        <SectionNav sections={SECTIONS} />
      </div>

      <div className="mt-6 flex flex-col gap-12">
        <Section
          id="ringkasan"
          title="Ringkasan"
          description={`Sistem yang direkomendasikan dan dampaknya pada tagihan listrik Anda di ${result.input.location.name}.`}
        >
          <WarningsList result={result} />
          <GreenNeedsCard result={result} />
          <div className="grid gap-4 lg:grid-cols-2">
            <SystemSpecCard result={result} />
            <div className="flex flex-col gap-4">
              <BillCard result={result} />
            </div>
          </div>
          <CapexCard result={result} />
        </Section>

        <Section
          id="energi"
          title="Produksi & pemakaian energi"
          description="Simulasi per jam untuk hari representatif setiap bulan, mempertimbangkan posisi matahari, suhu panel, dan susut sistem."
        >
          <EnergyStats result={result} />
          <MonthlyEnergyCharts result={result} />
          <DailyProfileChart result={result} />
        </Section>

        <Section
          id="keuangan"
          title="Analisis keuangan"
          description={`Arus kas selama ${lifetime} tahun dengan kenaikan tarif, degradasi panel, perawatan, dan penggantian komponen.`}
        >
          <FinanceStats result={result} />
          <CashflowChart result={result} />
          <LoanCard result={result} />
          <CashflowTable result={result} />
        </Section>

        <Section
          id="ukuran"
          title="Pilihan kapasitas"
          description="Karena surplus tidak dikompensasi, sistem yang lebih besar tidak selalu lebih menguntungkan. Bandingkan beberapa ukuran berikut."
        >
          <SizingCharts curve={result.sizing.curve} selectedKwp={result.system.kwp} />
          <SizingOptionsList
            options={result.sizing.options}
            currentKwp={result.system.kwp}
            onApply={editable ? applySize : undefined}
          />
        </Section>

        <Section
          id="bandingkan"
          title="Bandingkan jenis sistem & risiko"
          description="Perbandingan on-grid, hybrid, dan off-grid untuk pemakaian Anda, serta seberapa sensitif balik modal terhadap perubahan asumsi."
        >
          <ComparisonTable extras={extras} currentType={result.system.type} onSwitch={editable ? switchType : undefined} />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h3 className="text-base font-bold text-slate-900">Analisis sensitivitas balik modal</h3>
            <p className="mb-4 mt-0.5 text-[13px] text-slate-500">
              Bagaimana lama balik modal berubah bila satu asumsi berbeda dari perkiraan.
            </p>
            {extras ? (
              <SensitivityTornado items={extras.sensitivity} basePayback={ev.metrics.paybackYears} lifetime={lifetime} />
            ) : (
              <div className="h-48 animate-pulse-soft rounded-2xl bg-slate-100" aria-busy="true" />
            )}
          </div>
        </Section>

        <Section id="lingkungan" title="Dampak lingkungan">
          <EnvironmentCard result={result} />
        </Section>

        <Section
          id="asumsi"
          title="Asumsi & metodologi"
          description="Semua angka di atas dihitung dari asumsi berikut. Ubah di kalkulator bila Anda memiliki data yang lebih akurat."
        >
          <AssumptionsList result={result} />
          <div className="rounded-2xl bg-amber-50 p-5 text-[13px] leading-relaxed text-amber-950 ring-1 ring-amber-200">
            <strong>Disclaimer:</strong> Hasil ini adalah estimasi berbasis model dan asumsi umum, bukan penawaran harga maupun
            jaminan kinerja. Produksi aktual dipengaruhi cuaca, bayangan, kualitas instalasi, dan perawatan. Lakukan survei lokasi
            dan minta penawaran resmi dari installer bersertifikat, serta ikuti ketentuan PLN dan regulasi yang berlaku.{" "}
            <Link href="/metodologi" className="font-semibold underline underline-offset-2">
              Baca metodologi lengkap
            </Link>
            .
          </div>
        </Section>

        {editable && history.length > 0 ? (
          <section aria-labelledby="riwayat-title" className="no-print">
            <h2 id="riwayat-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <History className="h-5 w-5 text-emerald-700" aria-hidden /> Tersimpan di perangkat ini
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200"
                >
                  <Link href={`/hasil/${h.id}`} className="min-w-0 hover:underline">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {h.title ?? h.summary.locationName}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {formatKwp(h.summary.kwp)} · {formatRupiahCompact(h.summary.capex)} · BM{" "}
                      {formatYears(h.summary.paybackYears)}
                    </span>
                  </Link>
                  <Button variant="ghost" size="icon" aria-label="Hapus dari riwayat" onClick={() => removeHistory(h.id)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
