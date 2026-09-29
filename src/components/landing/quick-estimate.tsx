"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Leaf, SlidersHorizontal, Sparkles } from "lucide-react";
import { CITIES } from "@/lib/data/locations";
import { getTariff } from "@/lib/data/tariffs";
import { calculate, createDefaultInput, SYSTEM_LABELS, type CalculatorInput } from "@/lib/engine";
import { formatKwp, formatPercent, formatRupiahCompact, formatYears } from "@/lib/format";
import { useCalculatorStore } from "@/store/calculator";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/inputs";
import { NativeSelect } from "@/components/ui/select";
import { Slider } from "@/components/ui/choice";
import { Meter } from "@/components/ui/stat";

const QUICK_TARIFFS = ["R1-900", "R1-1300", "R1-2200", "R2", "R3", "B2"];
const MIN_BILL = 100_000;
const MAX_BILL = 20_000_000;

/** Slider logaritmik agar tagihan kecil tetap presisi. */
function billFromSlider(p: number): number {
  const v = MIN_BILL * Math.pow(MAX_BILL / MIN_BILL, p / 100);
  const step = v < 1_000_000 ? 50_000 : v < 5_000_000 ? 100_000 : 500_000;
  return Math.round(v / step) * step;
}
function sliderFromBill(b: number): number {
  const clamped = Math.min(MAX_BILL, Math.max(MIN_BILL, b));
  return (Math.log(clamped / MIN_BILL) / Math.log(MAX_BILL / MIN_BILL)) * 100;
}

const provinces = [...new Set(CITIES.map((c) => c.province))];

export function QuickEstimate() {
  const router = useRouter();
  const setInput = useCalculatorStore((s) => s.setInput);
  const [cityId, setCityId] = useState("jakarta");
  const [tariffId, setTariffId] = useState("R1-2200");
  const [bill, setBill] = useState<number | null>(1_000_000);

  const input = useMemo<CalculatorInput>(() => {
    const base = createDefaultInput(cityId);
    const tariff = getTariff(tariffId);
    return {
      ...base,
      consumption: {
        ...base.consumption,
        tariffId,
        va: tariff?.defaultVa ?? 2200,
        monthlyBill: Math.max(MIN_BILL / 2, bill ?? MIN_BILL),
      },
    };
  }, [cityId, tariffId, bill]);
  const deferred = useDeferredValue(input);
  const result = useMemo(() => {
    try {
      return calculate(deferred);
    } catch {
      return null;
    }
  }, [deferred]);

  const go = (step?: string) => {
    setInput(input);
    router.push(step ? `/kalkulator?step=${step}` : "/kalkulator");
  };

  const ev = result?.evaluation;

  return (
    <div className="relative rounded-3xl bg-white p-5 text-slate-900 shadow-lift ring-1 ring-black/5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-emerald-700 uppercase">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Hitung cepat
          </p>
          <h2 className="mt-1 text-lg font-bold sm:text-xl">Estimasi PLTS untuk rumah Anda</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Kota</span>
            <NativeSelect value={cityId} onChange={(e) => setCityId(e.target.value)} aria-label="Kota">
              {provinces.map((p) => (
                <optgroup key={p} label={p}>
                  {CITIES.filter((c) => c.province === p).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </NativeSelect>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Daya listrik PLN</span>
            <NativeSelect value={tariffId} onChange={(e) => setTariffId(e.target.value)} aria-label="Golongan & daya PLN">
              {QUICK_TARIFFS.map((id) => {
                const t = getTariff(id)!;
                return (
                  <option key={id} value={id}>
                    {t.label}
                  </option>
                );
              })}
            </NativeSelect>
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quick-bill" className="text-sm font-semibold text-slate-700">
            Tagihan listrik per bulan
          </label>
          <CurrencyInput id="quick-bill" value={bill} onValueChange={setBill} placeholder="1.000.000" />
          <Slider
            ariaLabel="Geser tagihan listrik per bulan"
            value={sliderFromBill(bill ?? MIN_BILL)}
            onValueChange={(p) => setBill(billFromSlider(p))}
            min={0}
            max={100}
            step={0.5}
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50/60 p-4 ring-1 ring-emerald-100" aria-live="polite">
        {result && ev ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-sm font-semibold text-emerald-900">
                Rekomendasi PLTS {SYSTEM_LABELS[result.system.type]}
              </p>
              <p className="text-xs text-emerald-800/80">
                {result.system.panelCount} panel × {result.system.panelWp} Wp
              </p>
            </div>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-900">{formatKwp(result.system.kwp)}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/80 px-2 py-2.5">
                <dt className="text-[11px] font-medium text-slate-500">Investasi</dt>
                <dd className="mt-0.5 text-sm font-bold sm:text-base">{formatRupiahCompact(ev.capex)}</dd>
              </div>
              <div className="rounded-xl bg-white/80 px-2 py-2.5">
                <dt className="text-[11px] font-medium text-slate-500">Hemat/bulan</dt>
                <dd className="mt-0.5 text-sm font-bold text-emerald-700 sm:text-base">
                  {formatRupiahCompact(ev.year1.savings / 12)}
                </dd>
              </div>
              <div className="rounded-xl bg-white/80 px-2 py-2.5">
                <dt className="text-[11px] font-medium text-slate-500">Balik modal</dt>
                <dd className="mt-0.5 text-sm font-bold sm:text-base">
                  {ev.metrics.paybackYears === null ? "> umur" : formatYears(ev.metrics.paybackYears).replace(" tahun", " thn").replace(" bulan", " bln")}
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-emerald-900">
                <span className="flex items-center gap-1">
                  <Leaf className="h-3.5 w-3.5" aria-hidden /> Porsi energi hijau
                </span>
                <span>{formatPercent(ev.year1.solarFractionPct)}</span>
              </div>
              <Meter value={ev.year1.solarFractionPct} label="Porsi energi hijau" />
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">Masukkan tagihan minimal Rp50.000 untuk melihat estimasi.</p>
        )}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Button size="lg" onClick={() => go("hasil")} disabled={!result}>
          Lihat analisis lengkap <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <Button size="lg" variant="outline" onClick={() => go()}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> Atur detail
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">Gratis · tanpa daftar · data tersimpan di perangkat Anda</p>
    </div>
  );
}
