"use client";

import { CalendarDays, Clock, Receipt, Zap } from "lucide-react";
import { useCalculatorStore } from "@/store/calculator";
import { LOAD_PROFILES, daytimeShare, resolveProfile, type LoadProfileId } from "@/lib/data/load-profiles";
import { CATEGORY_LABELS, CUSTOM_TARIFF_ID, TARIFFS, formatVa, getTariff, type CustomerCategory } from "@/lib/data/tariffs";
import { MONTH_LABELS } from "@/lib/engine/constants";
import type { CalculationResult } from "@/lib/engine";
import { formatNumber, formatPercent, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChoiceCards, Segmented, Slider } from "@/components/ui/choice";
import { Field, SectionTitle } from "@/components/ui/field";
import { CurrencyInput, NumberInput } from "@/components/ui/inputs";
import { Accordion } from "@/components/ui/overlay";
import { NativeSelect } from "@/components/ui/select";
import { ProfileSparkline } from "../mini-charts";

const CATEGORY_DEFAULT: Record<CustomerCategory, string> = {
  "rumah-tangga": "R1-2200",
  bisnis: "B2",
  industri: "I3",
  lainnya: "P1",
};

const BILL_CHIPS = [500_000, 1_000_000, 2_000_000, 5_000_000];

export function UsageStep({ result }: { result: CalculationResult | null }) {
  const c = useCalculatorStore((s) => s.input.consumption);
  const update = useCalculatorStore((s) => s.update);
  const setTariff = useCalculatorStore((s) => s.setTariff);
  const set = (patch: Partial<typeof c>) => update("consumption", patch);

  const tariff = getTariff(c.tariffId);
  const category: CustomerCategory = tariff?.category ?? "lainnya";
  const categoryTariffs = TARIFFS.filter((t) => t.category === category);
  const effectiveRate = result?.consumption.effectiveRate;
  const kwhFromBill = effectiveRate ? c.monthlyBill / effectiveRate : null;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <SectionTitle
          icon={<Zap className="h-5 w-5" aria-hidden />}
          title="Sambungan PLN"
          description="Golongan tarif menentukan harga listrik yang Anda hemat."
        />
        <Field label="Jenis pelanggan" asGroup>
          <Segmented
            ariaLabel="Jenis pelanggan"
            value={category}
            onValueChange={(v) => setTariff(CATEGORY_DEFAULT[v])}
            options={(Object.keys(CATEGORY_LABELS) as CustomerCategory[]).map((k) => ({ value: k, label: CATEGORY_LABELS[k] }))}
            className="grid-flow-row grid-cols-2 sm:grid-flow-col sm:grid-cols-none"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Golongan tarif"
            htmlFor="tariff"
            hint={
              tariff
                ? `${tariff.code} · ${formatRupiah(tariff.rate)}/kWh${tariff.note ? ` · ${tariff.note}` : ""}`
                : "Masukkan tarif per kWh sesuai tagihan Anda."
            }
          >
            <NativeSelect id="tariff" value={c.tariffId} onChange={(e) => setTariff(e.target.value)}>
              {categoryTariffs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
              <option value={CUSTOM_TARIFF_ID}>Tarif lain / kustom</option>
            </NativeSelect>
          </Field>
          {c.tariffId === CUSTOM_TARIFF_ID ? (
            <Field label="Daya tersambung" htmlFor="va-custom">
              <NumberInput
                id="va-custom"
                value={c.va}
                decimals={0}
                min={450}
                max={100_000_000}
                suffix="VA"
                onValueChange={(v) => v !== null && set({ va: Math.round(v) })}
              />
            </Field>
          ) : tariff && tariff.vaOptions.length > 1 ? (
            <Field label="Daya tersambung" htmlFor="va">
              <NativeSelect id="va" value={c.va} onChange={(e) => set({ va: Number(e.target.value) })}>
                {tariff.vaOptions.map((va) => (
                  <option key={va} value={va}>
                    {formatVa(va)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : (
            <Field label="Daya tersambung" asGroup>
              <p className="flex h-12 items-center rounded-xl bg-slate-50 px-3.5 text-base font-semibold text-slate-700">
                {formatVa(c.va)}
              </p>
            </Field>
          )}
        </div>
        {c.tariffId === CUSTOM_TARIFF_ID ? (
          <Field
            label="Tarif listrik per kWh"
            htmlFor="custom-rate"
            hint="Lihat rincian tagihan atau struk token PLN Anda (sebelum pajak)."
          >
            <CurrencyInput
              id="custom-rate"
              value={c.customRate}
              suffix="/kWh"
              onValueChange={(v) => set({ customRate: v && v >= 100 ? Math.min(v, 10_000) : null })}
            />
          </Field>
        ) : null}
      </section>

      <section className="flex flex-col gap-5">
        <SectionTitle
          icon={<Receipt className="h-5 w-5" aria-hidden />}
          title="Pemakaian listrik"
          description="Gunakan rata-rata 3–6 bulan terakhir agar lebih akurat."
        />
        <Segmented
          ariaLabel="Cara memasukkan pemakaian"
          value={c.inputMode}
          onValueChange={(v) => {
            if (v === "monthly" && !c.monthlyKwhSeries) {
              const base = result ? Math.round(result.consumption.monthlyKwh[0]) : c.monthlyKwh;
              set({ inputMode: v, monthlyKwhSeries: new Array(12).fill(base) });
            } else set({ inputMode: v });
          }}
          options={[
            { value: "bill", label: "Tagihan (Rp)" },
            { value: "kwh", label: "kWh/bulan" },
            { value: "monthly", label: "Per bulan", icon: <CalendarDays className="h-4 w-4" aria-hidden /> },
          ]}
        />

        {c.inputMode === "bill" ? (
          <Field
            label="Rata-rata tagihan per bulan"
            htmlFor="bill"
            hint={
              kwhFromBill
                ? `≈ ${formatNumber(kwhFromBill)} kWh/bulan dengan tarif efektif ${formatRupiah(effectiveRate!)}/kWh (termasuk pajak).`
                : undefined
            }
          >
            <CurrencyInput id="bill" value={c.monthlyBill} onValueChange={(v) => v !== null && set({ monthlyBill: v })} />
            <div className="flex flex-wrap gap-2">
              {BILL_CHIPS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set({ monthlyBill: b })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    c.monthlyBill === b
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 text-slate-600 hover:border-slate-300",
                  )}
                >
                  {formatRupiah(b)}
                </button>
              ))}
            </div>
          </Field>
        ) : null}

        {c.inputMode === "kwh" ? (
          <Field
            label="Rata-rata pemakaian per bulan"
            htmlFor="kwh"
            hint="Tertera di tagihan pascabayar atau riwayat di aplikasi PLN Mobile."
          >
            <NumberInput
              id="kwh"
              value={c.monthlyKwh}
              decimals={0}
              min={10}
              max={10_000_000}
              suffix="kWh/bln"
              onValueChange={(v) => v !== null && set({ monthlyKwh: v })}
            />
          </Field>
        ) : null}

        {c.inputMode === "monthly" && c.monthlyKwhSeries ? (
          <Field
            label="Pemakaian tiap bulan (kWh)"
            asGroup
            hint="Isi dari riwayat pemakaian PLN Mobile. Bulan kosong diisi rata-rata bulan lain."
          >
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {c.monthlyKwhSeries.map((v, m) => (
                <label key={m} className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  {MONTH_LABELS[m]}
                  <NumberInput
                    value={v}
                    decimals={0}
                    min={0}
                    max={10_000_000}
                    className="h-10 px-2.5 text-sm"
                    aria-label={`Pemakaian ${MONTH_LABELS[m]} (kWh)`}
                    onValueChange={(nv) => {
                      if (nv === null) return;
                      const series = [...c.monthlyKwhSeries!];
                      series[m] = nv;
                      set({ monthlyKwhSeries: series });
                    }}
                  />
                </label>
              ))}
            </div>
          </Field>
        ) : null}
      </section>

      <section className="flex flex-col gap-5">
        <SectionTitle
          icon={<Clock className="h-5 w-5" aria-hidden />}
          title="Pola pemakaian harian"
          description="PLTS hanya berproduksi siang hari. Karena surplus ke PLN tidak dikompensasi, porsi pemakaian siang sangat menentukan penghematan."
        />
        <ChoiceCards<LoadProfileId>
          ariaLabel="Pola pemakaian"
          value={c.profileId}
          onValueChange={(v) => set({ profileId: v })}
          className="sm:grid-cols-2 lg:grid-cols-3"
          options={LOAD_PROFILES.map((p) => {
            const profile = resolveProfile(p.id, c.daytimeSharePct);
            return {
              value: p.id,
              label: p.label,
              description: (
                <>
                  <span className="mt-1 block">
                    <ProfileSparkline profile={profile} />
                  </span>
                  <span className="mt-1.5 block font-semibold text-emerald-700">
                    Siang {formatPercent(daytimeShare(profile) * 100)}
                  </span>
                  <span className="mt-1 block">{p.description}</span>
                </>
              ),
            };
          })}
        />
        {c.profileId === "kustom" ? (
          <Field label="Porsi pemakaian siang (06.00–18.00)" asGroup>
            <div className="flex items-center gap-4">
              <Slider
                ariaLabel="Porsi pemakaian siang"
                value={c.daytimeSharePct}
                min={10}
                max={90}
                step={1}
                onValueChange={(v) => set({ daytimeSharePct: v })}
              />
              <span className="w-14 shrink-0 text-right text-sm font-bold text-slate-800 tabular">{c.daytimeSharePct}%</span>
            </div>
          </Field>
        ) : null}
      </section>

      <Field
        label="Jenis meter saat ini"
        asGroup
        info="Pelanggan pascabayar dikenai rekening minimum (40 jam nyala). Setelah memasang PLTS atap on-grid/hybrid, pelanggan menjadi pascabayar sesuai Permen ESDM 2/2024."
      >
        <Segmented
          ariaLabel="Jenis meter"
          value={c.meterType}
          onValueChange={(v) => set({ meterType: v })}
          options={[
            { value: "prepaid", label: "Prabayar (token)" },
            { value: "postpaid", label: "Pascabayar" },
          ]}
        />
      </Field>

      <Accordion
        items={[
          {
            value: "adv-usage",
            title: "Pengaturan lanjutan",
            subtitle: "Pajak daerah & pertumbuhan pemakaian",
            content: (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Pajak penerangan (PBJT/PPJ)"
                  htmlFor="pbjt"
                  info="Pajak daerah atas tenaga listrik, umumnya 2,4–10% tergantung kabupaten/kota. Lihat struk token atau rincian tagihan."
                  hint={tariff?.vat ? "PPN 11% untuk rumah tangga ≥ 6.600 VA ditambahkan otomatis." : undefined}
                >
                  <NumberInput
                    id="pbjt"
                    value={c.pbjtPct}
                    decimals={1}
                    min={0}
                    max={15}
                    suffix="%"
                    onValueChange={(v) => v !== null && set({ pbjtPct: v })}
                  />
                </Field>
                <Field
                  label="Pertumbuhan pemakaian"
                  htmlFor="growth"
                  info="Kenaikan pemakaian listrik per tahun, mis. karena menambah AC atau kendaraan listrik."
                >
                  <NumberInput
                    id="growth"
                    value={c.growthPct}
                    decimals={1}
                    min={0}
                    max={20}
                    suffix="%/tahun"
                    onValueChange={(v) => v !== null && set({ growthPct: v })}
                  />
                </Field>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
