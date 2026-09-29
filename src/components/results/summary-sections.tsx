"use client";

import {
  ArrowDown,
  BatteryCharging,
  Car,
  CircleDollarSign,
  Clock,
  Cpu,
  Factory,
  Gauge,
  Leaf,
  LayoutGrid,
  PiggyBank,
  Ruler,
  Sprout,
  Sun,
  TreePine,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { SYSTEM_LABELS, type CalculationResult } from "@/lib/engine";
import {
  formatDecimal,
  formatKg,
  formatKwh,
  formatKwp,
  formatNumber,
  formatPercent,
  formatRupiah,
  formatRupiahCompact,
  formatYears,
  formatYearsCompact,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter, StatTile } from "@/components/ui/stat";
import { FeasibilityBadge, WarningIcon } from "./feasibility-badge";

export function ResultHero({ result }: { result: CalculationResult }) {
  const ev = result.evaluation;
  const s = result.system;
  const loc = result.input.location;
  const net25 = ev.metrics.totalNetCashflow - ev.capex;
  return (
    <section
      aria-labelledby="hasil-judul"
      className="overflow-hidden rounded-[2rem] bg-forest-deep text-white shadow-lift print:rounded-none print:bg-white print:text-slate-900 print:shadow-none"
    >
      <div className="relative p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl print:hidden" aria-hidden />
        <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl print:hidden" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-emerald-200 print:text-emerald-700">
              Rekomendasi untuk {loc.name}
              {loc.province ? `, ${loc.province}` : ""}
            </p>
            <h1 id="hasil-judul" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              PLTS {SYSTEM_LABELS[s.type]} {formatKwp(s.kwp)}
            </h1>
            <p className="mt-2 text-base text-emerald-50/90 print:text-slate-600">
              {s.panelCount} panel × {s.panelWp} Wp · Inverter {s.inverterCount > 1 ? `${s.inverterCount} × ` : ""}
              {formatDecimal(s.inverterKw, 1)} kW
              {s.batteryKwh > 0 ? ` · Baterai ${formatDecimal(s.batteryKwh, 2)} kWh` : ""} · Atap ±{formatNumber(s.roofAreaM2)} m²
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <FeasibilityBadge level={result.feasibility.level} onDark />
              <p className="text-sm text-emerald-50/90 print:text-slate-600">{result.feasibility.summary}</p>
            </div>
          </div>
          <div className="shrink-0 rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur print:ring-slate-200">
            <p className="text-sm text-emerald-100 print:text-slate-500">Hemat per bulan (tahun pertama)</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {formatRupiahCompact(ev.year1.savings / 12)}
            </p>
            <p className="mt-1 text-sm text-emerald-100/90 print:text-slate-500">
              Tagihan {formatRupiahCompact(ev.year1.billBefore / 12)} → {formatRupiahCompact(ev.year1.billAfter / 12)}
            </p>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-6 print:bg-slate-200">
        {[
          { icon: Wallet, label: "Investasi awal", value: formatRupiahCompact(ev.capex) },
          { icon: Clock, label: "Balik modal", value: formatYearsCompact(ev.metrics.paybackYears, "> umur") },
          { icon: PiggyBank, label: `Untung bersih ${result.input.finance.lifetimeYears} th`, value: formatRupiahCompact(net25) },
          { icon: TrendingUp, label: "IRR", value: ev.metrics.irr === null ? "–" : formatPercent(ev.metrics.irr * 100, 1) },
          { icon: Leaf, label: "Porsi energi hijau", value: formatPercent(ev.year1.solarFractionPct) },
          { icon: Sprout, label: "CO₂ dihindari/th", value: formatKg(result.environment.co2Year1Kg) },
        ].map((k) => (
          <div key={k.label} className="bg-forest-deep px-5 py-4 print:bg-white">
            <dt className="flex items-center gap-1.5 text-[13px] text-emerald-200/90 print:text-slate-500">
              <k.icon className="h-4 w-4" aria-hidden /> {k.label}
            </dt>
            <dd className="mt-1 text-lg font-bold sm:text-xl">{k.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function WarningsList({ result }: { result: CalculationResult }) {
  if (result.warnings.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2" aria-label="Catatan penting">
      {result.warnings.map((w) => (
        <li
          key={w.code}
          className={cn(
            "flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed",
            w.level === "danger" && "border-rose-200 bg-rose-50 text-rose-900",
            w.level === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
            w.level === "info" && "border-sky-200 bg-sky-50 text-sky-950",
          )}
        >
          <WarningIcon level={w.level} />
          <span>{w.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function GreenNeedsCard({ result }: { result: CalculationResult }) {
  const c = result.consumption;
  const s = result.system;
  const ev = result.evaluation;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kebutuhan energi hijau Anda</CardTitle>
        <CardDescription>Berapa PLTS yang dibutuhkan untuk menggantikan listrik PLN dengan energi surya.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={<Zap className="h-4 w-4" aria-hidden />}
            tone="sky"
            label="Pemakaian"
            value={formatKwh(c.annualKwh / 12)}
            sub="rata-rata per bulan"
          />
          <StatTile
            icon={<Sun className="h-4 w-4" aria-hidden />}
            tone="amber"
            label="Pemakaian siang"
            value={formatPercent(c.daytimeSharePct)}
            sub="pukul 06.00–18.00"
          />
          <StatTile
            icon={<Gauge className="h-4 w-4" aria-hidden />}
            tone="green"
            label="Produksi per kWp"
            value={`${formatNumber(result.solar.specificYield)} kWh`}
            sub="per tahun di lokasi Anda"
          />
          <StatTile
            icon={<LayoutGrid className="h-4 w-4" aria-hidden />}
            label="Setara 100% kebutuhan"
            value={formatKwp(s.netZeroKwp)}
            sub={`${s.netZeroPanels} panel · ±${formatNumber(s.netZeroRoofM2)} m²`}
          />
        </div>
        <div className="rounded-2xl bg-emerald-50/70 p-4 text-sm leading-relaxed text-emerald-950">
          <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
            <span>Porsi kebutuhan listrik dari PLTS</span>
            <span>{formatPercent(ev.year1.solarFractionPct)}</span>
          </div>
          <Meter value={ev.year1.solarFractionPct} label="Porsi energi hijau" />
          <p className="mt-3">
            Secara tahunan, <strong>{formatKwp(s.netZeroKwp)}</strong> akan menyamai seluruh pemakaian Anda.{" "}
            {s.type === "off-grid"
              ? "Sistem off-grid dirancang agar kebutuhan terpenuhi dengan bantuan baterai: "
              : s.type === "hybrid"
                ? "Karena surplus ke PLN tidak dikompensasi dan setiap kWh baterai menambah biaya, "
                : "Karena surplus yang diekspor ke PLN tidak lagi mengurangi tagihan, "}
            kapasitas {s.type === "off-grid" ? "yang dibutuhkan" : "yang direkomendasikan"} adalah{" "}
            <strong>{formatKwp(s.kwp)}</strong> — memenuhi <strong>{formatPercent(ev.year1.solarFractionPct)}</strong> kebutuhan
            dengan <strong>{formatPercent(ev.year1.selfConsumptionPct)}</strong> produksi benar-benar terpakai.
          </p>
          <p className="mt-2 text-[13px] text-emerald-900/80">{s.sizingNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemSpecCard({ result }: { result: CalculationResult }) {
  const s = result.system;
  const ev = result.evaluation;
  const rows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    {
      icon: <Sun className="h-4 w-4" aria-hidden />,
      label: "Kapasitas panel",
      value: `${formatKwp(s.kwp)} (${s.panelCount} × ${s.panelLabel})`,
    },
    {
      icon: <Cpu className="h-4 w-4" aria-hidden />,
      label: "Inverter",
      value: `${s.inverterCount > 1 ? `${s.inverterCount} × ` : ""}${formatDecimal(s.inverterKw, 1)} kW ${s.type === "on-grid" ? "on-grid" : s.type} · ${s.inverterPhase} · rasio DC/AC ${formatDecimal(s.dcAcRatio, 2)}`,
    },
    ...(s.batteryKwh > 0
      ? [
          {
            icon: <BatteryCharging className="h-4 w-4" aria-hidden />,
            label: "Baterai LiFePO4",
            value: `${formatDecimal(s.batteryKwh, 2)} kWh (${s.batteryModules} modul) · usable ${formatDecimal(s.batteryUsableKwh, 1)} kWh`,
          },
        ]
      : []),
    {
      icon: <Ruler className="h-4 w-4" aria-hidden />,
      label: "Luas atap dibutuhkan",
      value: `±${formatNumber(s.roofAreaM2)} m²`,
    },
    {
      icon: <Zap className="h-4 w-4" aria-hidden />,
      label: "Produksi tahun pertama",
      value: `${formatKwh(ev.year1.production)} (${formatKwh(ev.year1.production / 12)}/bulan)`,
    },
    {
      icon: <Gauge className="h-4 w-4" aria-hidden />,
      label: "Kinerja sistem",
      value: `${formatNumber(result.solar.specificYield)} kWh/kWp/th · PR ${formatPercent(result.solar.performanceRatio * 100, 1)}`,
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spesifikasi sistem</CardTitle>
        <CardDescription>Gunakan sebagai acuan saat meminta penawaran ke installer.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                {r.icon}
              </span>
              <div className="min-w-0">
                <dt className="text-[13px] text-slate-500">{r.label}</dt>
                <dd className="text-sm font-semibold text-slate-900">{r.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function CapexCard({ result }: { result: CalculationResult }) {
  const ev = result.evaluation;
  const max = Math.max(...ev.capexItems.map((i) => i.amount));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimasi biaya investasi</CardTitle>
        <CardDescription>
          {formatRupiah(ev.pricePerKwp)}/kWp terpasang
          {result.input.finance.pricePerKwpOverride ? " (harga Anda)" : ` · kelas ${result.input.finance.priceTier}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {ev.capexItems.map((item) => (
            <li key={item.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900 tabular">{formatRupiah(item.amount)}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100" aria-hidden>
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(item.amount / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-baseline justify-between border-t border-slate-200 pt-4">
          <span className="font-semibold text-slate-700">Total investasi</span>
          <span className="text-xl font-extrabold text-slate-900">{formatRupiah(ev.capex)}</span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
          Rincian per komponen adalah estimasi komposisi umum pasar. Harga aktual dapat berbeda ±20% tergantung merek, lokasi, dan
          kondisi atap.
        </p>
      </CardContent>
    </Card>
  );
}

export function BillCard({ result }: { result: CalculationResult }) {
  const ev = result.evaluation;
  const before = ev.year1.billBefore / 12;
  const after = ev.year1.billAfter / 12;
  const reduction = before > 0 ? ((before - after) / before) * 100 : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tagihan listrik per bulan</CardTitle>
        <CardDescription>Rata-rata tahun pertama, termasuk pajak & rekening minimum.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[13px] text-slate-500">Sebelum PLTS</p>
            <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{formatRupiahCompact(before)}</p>
          </div>
          <ArrowDown className="h-5 w-5 -rotate-90 text-emerald-600" aria-hidden />
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-[13px] text-emerald-800">Setelah PLTS</p>
            <p className="mt-1 text-xl font-bold text-emerald-800 sm:text-2xl">{formatRupiahCompact(after)}</p>
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-[13px] font-semibold text-slate-600">
            <span>Tagihan berkurang</span>
            <span>{formatPercent(reduction)}</span>
          </div>
          <Meter value={reduction} label="Pengurangan tagihan" />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-slate-100 p-3">
            <dt className="text-[13px] text-slate-500">Hemat per tahun</dt>
            <dd className="font-bold text-slate-900">{formatRupiah(ev.year1.savings)}</dd>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <dt className="text-[13px] text-slate-500">Total hemat {result.input.finance.lifetimeYears} th</dt>
            <dd className="font-bold text-slate-900">{formatRupiahCompact(ev.metrics.totalSavings)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function EnergyStats({ result }: { result: CalculationResult }) {
  const y1 = result.evaluation.year1;
  const surplusPct = y1.production > 0 ? (y1.exported / y1.production) * 100 : 0;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={<Sun className="h-4 w-4" aria-hidden />}
        tone="amber"
        label="Produksi tahun ke-1"
        value={formatKwh(y1.production)}
        sub={`${formatKwh(y1.production / 365)}/hari rata-rata`}
      />
      <StatTile
        icon={<Leaf className="h-4 w-4" aria-hidden />}
        tone="green"
        label="Produksi terpakai"
        value={formatPercent(y1.selfConsumptionPct)}
        sub={`${formatKwh(y1.used)} menggantikan listrik PLN`}
      />
      <StatTile
        icon={<Zap className="h-4 w-4" aria-hidden />}
        tone="sky"
        label={result.system.type === "off-grid" ? "Tidak terpenuhi" : "Masih dari PLN"}
        value={formatKwh(result.system.type === "off-grid" ? y1.unmet : y1.gridImport)}
        sub="per tahun"
      />
      <StatTile
        icon={<Factory className="h-4 w-4" aria-hidden />}
        label="Surplus tidak terpakai"
        value={formatPercent(surplusPct)}
        sub={`${formatKwh(y1.exported)} per tahun`}
      />
    </div>
  );
}

export function EnvironmentCard({ result }: { result: CalculationResult }) {
  const e = result.environment;
  const items = [
    { icon: Sprout, label: "CO₂ dihindari per tahun", value: formatKg(e.co2Year1Kg) },
    { icon: Leaf, label: `CO₂ dihindari ${result.input.finance.lifetimeYears} tahun`, value: formatKg(e.co2LifetimeKg) },
    { icon: TreePine, label: "Setara penyerapan pohon", value: `${formatNumber(e.treesEquivalent)} pohon` },
    { icon: Car, label: "Setara perjalanan mobil", value: `${formatNumber(e.carKmEquivalent)} km/th` },
  ];
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-soft sm:p-8 print:bg-white print:text-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-2xl text-sm leading-relaxed text-emerald-50/90 print:text-slate-600">
            Setiap kWh dari atap Anda menggantikan listrik grid yang sebagian besar berasal dari PLTU batu bara (faktor emisi{" "}
            {formatDecimal(e.emissionFactor, 2)} kg CO₂/kWh).
          </p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 print:ring-slate-200">
            <i.icon className="h-5 w-5 text-lime-300 print:text-emerald-600" aria-hidden />
            <dt className="mt-3 text-[13px] text-emerald-50/85 print:text-slate-500">{i.label}</dt>
            <dd className="mt-0.5 text-xl font-bold sm:text-2xl">{i.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function FinanceStats({ result }: { result: CalculationResult }) {
  const m = result.evaluation.metrics;
  const rate = result.consumption.effectiveRate;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={<Clock className="h-4 w-4" aria-hidden />}
        tone="green"
        label="Balik modal"
        value={formatYears(m.paybackYears, "> umur sistem")}
        sub={`Terdiskonto: ${formatYears(m.discountedPaybackYears, "tidak tercapai")}`}
      />
      <StatTile
        icon={<CircleDollarSign className="h-4 w-4" aria-hidden />}
        tone="green"
        label="NPV"
        value={formatRupiahCompact(m.npv)}
        sub={`Diskonto ${formatDecimal(result.input.finance.discountRatePct, 1)}%/th`}
      />
      <StatTile
        icon={<TrendingUp className="h-4 w-4" aria-hidden />}
        label="IRR · ROI"
        value={m.irr === null ? "–" : formatPercent(m.irr * 100, 1)}
        sub={`ROI ${formatPercent(m.roiPct)} selama ${result.input.finance.lifetimeYears} th`}
      />
      <StatTile
        icon={<Zap className="h-4 w-4" aria-hidden />}
        tone="amber"
        label="Biaya listrik surya"
        value={`${formatRupiah(m.lcoeUsed)}/kWh`}
        sub={`vs PLN ${formatRupiah(rate)}/kWh (LCOE terpakai)`}
      />
    </div>
  );
}
