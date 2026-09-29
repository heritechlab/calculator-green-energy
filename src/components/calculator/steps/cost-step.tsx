"use client";

import { BadgePercent, Landmark, RotateCcw, Settings2, Tags } from "lucide-react";
import { useCalculatorStore } from "@/store/calculator";
import { PRICE_TIERS, type PriceTier } from "@/lib/data/prices";
import { annuityPayment, type CalculationResult, type FinanceInput } from "@/lib/engine";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChoiceCards, Segmented, Slider, Switch } from "@/components/ui/choice";
import { Field, SectionTitle } from "@/components/ui/field";
import { CurrencyInput, NumberInput } from "@/components/ui/inputs";
import { Accordion } from "@/components/ui/overlay";
import { NativeSelect } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

type NumericKey = {
  [K in keyof FinanceInput]: FinanceInput[K] extends number ? K : never;
}[keyof FinanceInput];

const ADVANCED: { key: NumericKey; label: string; suffix: string; min: number; max: number; decimals: number; info: string }[] = [
  {
    key: "tariffEscalationPct",
    label: "Kenaikan tarif PLN",
    suffix: "%/tahun",
    min: 0,
    max: 15,
    decimals: 1,
    info: "Rata-rata kenaikan tarif listrik per tahun. Tarif nonsubsidi relatif tetap sejak 2023; asumsi 2–4% umum dipakai untuk jangka panjang.",
  },
  { key: "inflationPct", label: "Inflasi biaya perawatan", suffix: "%/tahun", min: 0, max: 15, decimals: 1, info: "Kenaikan biaya O&M (pembersihan, pemeriksaan) per tahun." },
  {
    key: "discountRatePct",
    label: "Tingkat diskonto",
    suffix: "%/tahun",
    min: 0,
    max: 25,
    decimals: 1,
    info: "Imbal hasil alternatif atas uang Anda (mis. deposito/obligasi). Dipakai untuk NPV, payback terdiskonto, dan LCOE.",
  },
  { key: "lifetimeYears", label: "Umur analisis", suffix: "tahun", min: 10, max: 30, decimals: 0, info: "Panel bergaransi kinerja 25–30 tahun." },
  { key: "degradationFirstYearPct", label: "Degradasi tahun pertama", suffix: "%", min: 0, max: 5, decimals: 1, info: "Penurunan daya awal panel (LID), umumnya 1–2%." },
  { key: "degradationPct", label: "Degradasi tahunan", suffix: "%/tahun", min: 0, max: 2, decimals: 2, info: "Penurunan daya panel per tahun setelah tahun pertama (0,4–0,55%)." },
  { key: "omPct", label: "Biaya perawatan (O&M)", suffix: "% investasi", min: 0, max: 5, decimals: 1, info: "Biaya tahunan pembersihan & pemeriksaan sebagai persen investasi awal." },
  { key: "inverterLifeYears", label: "Umur inverter", suffix: "tahun", min: 5, max: 25, decimals: 0, info: "Inverter umumnya diganti sekali dalam 10–15 tahun." },
  { key: "inverterReplacementPct", label: "Biaya ganti inverter", suffix: "% sistem PV", min: 0, max: 40, decimals: 0, info: "Persentase dari biaya sistem PV awal (sudah memperhitungkan penurunan harga)." },
  { key: "batteryLifeYears", label: "Umur baterai", suffix: "tahun", min: 3, max: 25, decimals: 0, info: "Baterai LiFePO4 ±6.000 siklus; ganti sekitar 10–12 tahun." },
  {
    key: "exportCompensationPct",
    label: "Kompensasi ekspor ke PLN",
    suffix: "% tarif",
    min: 0,
    max: 100,
    decimals: 0,
    info: "Aturan saat ini (Permen ESDM 2/2024): 0% — surplus tidak mengurangi tagihan. Ubah hanya untuk simulasi skenario regulasi.",
  },
  { key: "emissionFactor", label: "Faktor emisi grid", suffix: "kg CO₂/kWh", min: 0.1, max: 1.5, decimals: 2, info: "Emisi rata-rata per kWh listrik PLN. Sistem Jawa–Madura–Bali ±0,84 kg CO₂/kWh." },
];

export function CostStep({ result }: { result: CalculationResult | null }) {
  const f = useCalculatorStore((s) => s.input.finance);
  const type = useCalculatorStore((s) => s.input.system.type);
  const update = useCalculatorStore((s) => s.update);
  const resetSection = useCalculatorStore((s) => s.resetSection);
  const set = (patch: Partial<FinanceInput>) => update("finance", patch);
  const useOwnPrice = f.pricePerKwpOverride !== null;

  const capex = result?.evaluation.capex ?? 0;
  const principal = capex * (1 - f.downPaymentPct / 100);
  const installment = annuityPayment(principal, f.loanRatePct / 100, f.loanTenorYears * 12);
  const monthlySavings = result ? result.evaluation.year1.savings / 12 : 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <SectionTitle icon={<Tags className="h-5 w-5" aria-hidden />} title="Harga sistem" description="Harga otomatis mengikuti kisaran pasar 2026 dan skala kapasitas." />
        <ChoiceCards<PriceTier>
          ariaLabel="Kelas komponen"
          value={f.priceTier}
          onValueChange={(v) => set({ priceTier: v })}
          className="sm:grid-cols-3"
          options={(Object.keys(PRICE_TIERS) as PriceTier[]).map((k) => ({
            value: k,
            label: PRICE_TIERS[k].label,
            description: PRICE_TIERS[k].description,
          }))}
        />
        <Switch
          id="own-price"
          checked={useOwnPrice}
          onCheckedChange={(v) => set({ pricePerKwpOverride: v ? Math.round(result?.evaluation.pricePerKwp ?? 14_000_000) : null })}
          label="Gunakan harga penawaran installer"
          description={
            result
              ? `Harga otomatis saat ini ${formatRupiah(result.evaluation.pricePerKwp)}/kWp (terpasang, termasuk inverter & instalasi${type !== "on-grid" ? ", tanpa baterai" : ""}).`
              : undefined
          }
        />
        {useOwnPrice ? (
          <Field label="Harga sistem per kWp" htmlFor="price-kwp" hint="Total penawaran dibagi kapasitas (kWp), di luar baterai.">
            <CurrencyInput
              id="price-kwp"
              value={f.pricePerKwpOverride}
              suffix="/kWp"
              onValueChange={(v) => set({ pricePerKwpOverride: v && v >= 1_000_000 ? Math.min(v, 100_000_000) : f.pricePerKwpOverride })}
            />
          </Field>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          {type !== "on-grid" ? (
            <Field label="Harga baterai per kWh" htmlFor="batt-price" info="Baterai LiFePO4 terpasang termasuk BMS. Kisaran 2026: Rp3–6 juta/kWh.">
              <CurrencyInput id="batt-price" value={f.batteryPricePerKwh} suffix="/kWh" onValueChange={(v) => v !== null && v >= 500_000 && set({ batteryPricePerKwh: v })} />
            </Field>
          ) : null}
          <Field label="Biaya tambahan" htmlFor="extra" info="Mis. perkuatan rangka atap, penggantian panel listrik rumah, atau biaya pengiriman ke luar kota.">
            <CurrencyInput id="extra" value={f.extraCost} onValueChange={(v) => set({ extraCost: v ?? 0 })} />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle icon={<Landmark className="h-5 w-5" aria-hidden />} title="Metode pembayaran" description="Bandingkan cicilan bulanan dengan penghematan tagihan." />
        <Segmented
          ariaLabel="Metode pembayaran"
          value={f.paymentMode}
          onValueChange={(v) => set({ paymentMode: v })}
          options={[
            { value: "cash", label: "Tunai" },
            { value: "loan", label: "Cicilan / kredit" },
          ]}
        />
        {f.paymentMode === "loan" ? (
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <Field label="Uang muka (DP)" asGroup aside={<span className="text-sm font-bold text-slate-800 tabular">{f.downPaymentPct}% · {formatRupiah(capex * (f.downPaymentPct / 100))}</span>}>
              <Slider ariaLabel="Uang muka" value={f.downPaymentPct} min={0} max={90} step={5} onValueChange={(v) => set({ downPaymentPct: v })} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Bunga per tahun" htmlFor="loan-rate" info="Suku bunga efektif (anuitas). Kredit/pinjaman hijau bank umumnya 8–13% per tahun.">
                <NumberInput id="loan-rate" value={f.loanRatePct} decimals={2} min={0} max={40} suffix="%/tahun" onValueChange={(v) => v !== null && set({ loanRatePct: v })} />
              </Field>
              <Field label="Tenor" htmlFor="tenor">
                <NativeSelect id="tenor" value={f.loanTenorYears} onChange={(e) => set({ loanTenorYears: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map((y) => (
                    <option key={y} value={y}>
                      {y} tahun ({y * 12} bulan)
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {result ? (
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <div>
                  <p className="text-slate-500">Cicilan per bulan</p>
                  <p className="text-lg font-extrabold text-slate-900">{formatRupiah(installment)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Hemat per bulan (thn 1)</p>
                  <p className="text-lg font-extrabold text-emerald-700">{formatRupiah(monthlySavings)}</p>
                </div>
                <p className="col-span-2 text-[13px] leading-relaxed text-slate-600">
                  {monthlySavings >= installment
                    ? "Penghematan sudah menutup cicilan sejak bulan pertama. 🎉"
                    : `Selama masa cicilan, Anda menambah ±${formatRupiah(installment - monthlySavings)}/bulan di atas penghematan.`}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle icon={<BadgePercent className="h-5 w-5" aria-hidden />} title="Asumsi finansial" description="Nilai default mengikuti praktik umum. Ubah bila Anda punya data lebih akurat." />
        <Accordion
          items={[
            {
              value: "adv-finance",
              title: (
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-slate-500" aria-hidden /> Asumsi lanjutan
                </span>
              ),
              subtitle: `Kenaikan tarif ${f.tariffEscalationPct}%/thn · diskonto ${f.discountRatePct}% · umur ${f.lifetimeYears} thn`,
              content: (
                <div className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {ADVANCED.filter((a) => type !== "on-grid" || a.key !== "batteryLifeYears").map((a) => (
                      <Field key={a.key} label={a.label} htmlFor={`adv-${a.key}`} info={a.info}>
                        <NumberInput
                          id={`adv-${a.key}`}
                          value={f[a.key]}
                          decimals={a.decimals}
                          min={a.min}
                          max={a.max}
                          suffix={a.suffix}
                          onValueChange={(v) => {
                            if (v === null || v < a.min || v > a.max) return;
                            set({ [a.key]: a.decimals === 0 ? Math.round(v) : v } as Partial<FinanceInput>);
                          }}
                        />
                      </Field>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      resetSection("finance");
                      toast("Asumsi biaya dikembalikan ke default");
                    }}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden /> Kembalikan ke default
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
