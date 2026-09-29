import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SYSTEM_LABELS } from "@/lib/engine";
import { formatKwp, formatRupiahCompact, formatYears } from "@/lib/format";
import { getReport } from "@/lib/server/reports";
import { SavedReportView } from "@/components/results/saved-report-view";

export const dynamic = "force-dynamic";

const loadReport = cache(async (id: string, countView: boolean) => getReport(id, { countView }));

export async function generateMetadata(props: PageProps<"/hasil/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const report = await loadReport(id, false).catch(() => null);
  if (!report) return { title: "Laporan tidak ditemukan", robots: { index: false } };
  const s = report.summary;
  const title = `PLTS ${SYSTEM_LABELS[s.systemType]} ${formatKwp(s.kwp)} — ${report.title ?? s.locationName}`;
  const description = `Investasi ${formatRupiahCompact(s.capex)}, hemat ${formatRupiahCompact(s.monthlySavings)}/bulan, balik modal ${formatYears(s.paybackYears)}, ${s.solarFractionPct}% energi hijau.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SavedReportPage(props: PageProps<"/hasil/[id]">) {
  const { id } = await props.params;
  const report = await loadReport(id, true);
  if (!report) notFound();
  return (
    <SavedReportView
      input={report.input}
      report={{ id: report.id, title: report.title, createdAt: report.createdAt, viewCount: report.viewCount }}
    />
  );
}
