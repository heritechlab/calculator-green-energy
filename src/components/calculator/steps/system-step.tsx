"use client";

import { BatteryCharging, Gauge, Sun, Zap } from "lucide-react";
import { useCalculatorStore } from "@/store/calculator";
import { PANELS } from "@/lib/data/panels";
import { MODEL, type CalculationResult, type SystemType } from "@/lib/engine";
import { formatDecimal, formatKwp, formatNumber, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ChoiceCards, Segmented, Slider, Switch } from "@/components/ui/choice";
import { Field, SectionTitle } from "@/components/ui/field";
import { CurrencyInput, NumberInput } from "@/components/ui/inputs";
import { NativeSelect } from "@/components/ui/select";

const SYSTEM_OPTIONS: { value: SystemType; label: string; description: string; icon: React.ReactNode; badge: React.ReactNode }[] = [
  {
    value: "on-grid",
    label: "On-Grid",
    description: "Terhubung PLN tanpa baterai. Paling ekonomis; ikut padam saat PLN padam.",
    icon: <Zap className="h-5 w-5" aria-hidden />,
    badge: <Badge tone="green">Paling hemat</Badge>,
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Terhubung PLN + baterai. Surplus siang dipakai malam & cadangan saat padam.",
    icon: <BatteryCharging className="h-5 w-5" aria-hidden />,
    badge: <Badge tone="sky">Ada cadangan</Badge>,
  },
  {
    value: "off-grid",
    label: "Off-Grid",
    description: "Mandiri tanpa PLN dengan baterai besar. Untuk lokasi tanpa jaringan PLN.",
    icon: <Sun className="h-5 w-5" aria-hidden />,
    badge: <Badge tone="amber">Mandiri</Badge>,
  },
];

const SIZING_HINT = {
  optimal: "Kalkulator mencoba semua ukuran dan memilih yang memberi keuntungan bersih (NPV) terbesar selama umur sistem.",
  target: "Tentukan berapa persen kebutuhan listrik yang ingin dipenuhi energi surya.",
  manual: "Masukkan kapasitas sendiri, misalnya dari penawaran installer.",
} as const;

export function SystemStep({ result }: { result: CalculationResult | null }) {
  const s = useCalculatorStore((st) => st.input.system);
  const update = useCalculatorStore((st) => st.update);
  const set = (patch: Partial<typeof s>) => update("system", patch);
  const panel = PANELS.find((p) => p.id === s.panelId) ?? PANELS[1];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <SectionTitle icon={<Sun className="h-5 w-5" aria-hidden />} title="Jenis sistem" description="Tidak yakin? Pilih on-grid — hasil akhir tetap menampilkan perbandingan ketiganya." />
        <ChoiceCards<SystemType> ariaLabel="Jenis sistem PLTS" value={s.type} onValueChange={(v) => set({ type: v })} options={SYSTEM_OPTIONS} className="sm:grid-cols-3" />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle icon={<Gauge className="h-5 w-5" aria-hidden />} title="Menentukan kapasitas" description={s.type === "off-grid" ? "Sistem off-grid diukur agar memenuhi seluruh kebutuhan sepanjang tahun." : SIZING_HINT[s.sizingMode]} />
        {s.type !== "off-grid" ? (
          <Segmented
            ariaLabel="Cara menentukan kapasitas"
            value={s.sizingMode}
            onValueChange={(v) => set({ sizingMode: v })}
            options={[
              { value: "optimal", label: "Optimal" },
              { value: "target", label: "Target %" },
              { value: "manual", label: "Manual" },
            ]}
          />
        ) : (
          <Segmented
            ariaLabel="Cara menentukan kapasitas off-grid"
            value={s.sizingMode === "manual" ? "manual" : "optimal"}
            onValueChange={(v) => set({ sizingMode: v })}
            options={[
              { value: "optimal", label: "Otomatis (penuhi kebutuhan)" },
              { value: "manual", label: "Manual" },
            ]}
          />
        )}

        {s.sizingMode === "target" && s.type !== "off-grid" ? (
          <Field label="Porsi kebutuhan listrik dari energi surya" asGroup hint={result ? `Saat ini: ${formatPercent(result.evaluation.year1.solarFractionPct)} dengan ${formatKwp(result.system.kwp)}.` : undefined}>
            <div className="flex items-center gap-4">
              <Slider ariaLabel="Target porsi energi surya" value={s.targetPct} min={10} max={100} step={5} onValueChange={(v) => set({ targetPct: v })} />
              <span className="w-14 shrink-0 text-right text-sm font-bold text-slate-800 tabular">{s.targetPct}%</span>
            </div>
          </Field>
        ) : null}

        {s.sizingMode === "manual" ? (
          <Field label="Kapasitas PLTS" htmlFor="manual-kwp" hint={`≈ ${Math.max(1, Math.round((s.manualKwp * 1000) / panel.wp))} panel × ${panel.wp} Wp`}>
            <NumberInput id="manual-kwp" value={s.manualKwp} decimals={2} min={0.3} max={10_000} suffix="kWp" onValueChange={(v) => v !== null && v >= 0.3 && set({ manualKwp: v })} />
          </Field>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tipe panel surya" htmlFor="panel" info="Panel berdaya lebih besar membutuhkan lebih sedikit unit dan luas atap per kWp. Koefisien suhu yang lebih kecil (TOPCon/HJT) sedikit lebih baik di iklim tropis.">
            <NativeSelect id="panel" value={s.panelId} onChange={(e) => set({ panelId: e.target.value })}>
              {PANELS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} · {formatDecimal(p.efficiencyPct, 1)}%
                </option>
              ))}
            </NativeSelect>
          </Field>
          {result ? (
            <div className="flex flex-col justify-end gap-1 rounded-2xl bg-emerald-50/70 p-4 text-sm">
              <span className="text-slate-600">Kapasitas saat ini</span>
              <span className="text-xl font-extrabold text-emerald-800">
                {formatKwp(result.system.kwp)} · {result.system.panelCount} panel
              </span>
              <span className="text-xs text-slate-500">Butuh atap ±{formatNumber(result.system.roofAreaM2)} m²</span>
            </div>
          ) : null}
        </div>

        {s.type !== "off-grid" ? (
          <Switch
            id="limit-connection"
            checked={s.limitToConnection}
            onCheckedChange={(v) => set({ limitToConnection: v })}
            label="Batasi kapasitas sesuai daya tersambung PLN"
            description="Permen ESDM 2/2024 tidak lagi membatasi kapasitas secara individu (mengikuti kuota wilayah), tetapi batas ini umum dipakai agar inverter sepadan dengan sambungan PLN."
          />
        ) : null}
      </section>

      {s.type === "hybrid" ? (
        <section className="flex flex-col gap-4">
          <SectionTitle icon={<BatteryCharging className="h-5 w-5" aria-hidden />} title="Baterai" description="Baterai LiFePO4 modular 5,12 kWh (51,2 V × 100 Ah), DoD 90%." />
          <Segmented
            ariaLabel="Tujuan baterai"
            value={s.batteryMode}
            onValueChange={(v) => set({ batteryMode: v })}
            options={[
              { value: "surplus", label: "Simpan surplus" },
              { value: "backup", label: "Cadangan padam" },
              { value: "manual", label: "Manual" },
            ]}
          />
          {s.batteryMode === "surplus" ? (
            <p className="text-[13px] leading-relaxed text-slate-500">Kapasitas dipilih agar kelebihan listrik siang dapat dipakai malam hari.</p>
          ) : null}
          {s.batteryMode === "backup" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Lama cadangan" htmlFor="backup-hours">
                <NumberInput id="backup-hours" value={s.backupHours} decimals={1} min={0.5} max={72} suffix="jam" onValueChange={(v) => v !== null && set({ backupHours: v })} />
              </Field>
              <Field label="Beban penting saat padam" htmlFor="backup-w" hint="Contoh: lampu, kulkas, router, kipas ±300–600 W.">
                <NumberInput id="backup-w" value={s.backupLoadW} decimals={0} min={50} max={5_000_000} suffix="watt" onValueChange={(v) => v !== null && set({ backupLoadW: v })} />
              </Field>
            </div>
          ) : null}
          {s.batteryMode === "manual" ? (
            <Field label="Kapasitas baterai" htmlFor="batt-kwh">
              <NumberInput id="batt-kwh" value={s.manualBatteryKwh} decimals={2} min={1} max={100_000} suffix="kWh" onValueChange={(v) => v !== null && set({ manualBatteryKwh: v })} />
            </Field>
          ) : null}
          {result && result.system.batteryKwh > 0 ? (
            <p className="rounded-xl bg-fuchsia-50/60 px-3.5 py-3 text-[13px] leading-relaxed text-slate-700">
              Baterai {formatDecimal(result.system.batteryKwh, 2)} kWh ({result.system.batteryModules} modul) · usable{" "}
              {formatDecimal(result.system.batteryUsableKwh, 1)} kWh — cukup ±{formatDecimal(result.system.backupHours ?? 0, 1)} jam untuk beban{" "}
              {formatNumber(s.backupLoadW)} W.
            </p>
          ) : null}
        </section>
      ) : null}

      {s.type === "off-grid" ? (
        <section className="flex flex-col gap-4">
          <SectionTitle icon={<BatteryCharging className="h-5 w-5" aria-hidden />} title="Baterai & pembanding" description="Hari otonomi = berapa hari kebutuhan listrik bisa dipenuhi baterai saat mendung." />
          <Field label="Hari otonomi baterai" asGroup>
            <div className="flex items-center gap-4">
              <Slider ariaLabel="Hari otonomi" value={s.autonomyDays} min={0.5} max={3} step={0.5} onValueChange={(v) => set({ autonomyDays: v })} />
              <span className="w-16 shrink-0 text-right text-sm font-bold text-slate-800 tabular">{formatDecimal(s.autonomyDays, 1)} hari</span>
            </div>
          </Field>
          <Field label="Sumber listrik yang digantikan" asGroup info="Penghematan off-grid dihitung terhadap biaya listrik yang Anda keluarkan saat ini (PLN atau genset diesel).">
            <Segmented
              ariaLabel="Sumber listrik pembanding"
              value={s.offgridBaseline}
              onValueChange={(v) => set({ offgridBaseline: v })}
              options={[
                { value: "pln", label: "Listrik PLN" },
                { value: "genset", label: "Genset diesel" },
              ]}
            />
          </Field>
          {s.offgridBaseline === "genset" ? (
            <Field label="Biaya listrik genset" htmlFor="genset" hint="Solar ±Rp13.000/liter × 0,35–0,45 liter/kWh + perawatan ≈ Rp5.000–7.000/kWh.">
              <CurrencyInput id="genset" value={s.gensetCostPerKwh} suffix="/kWh" onValueChange={(v) => v !== null && v >= 500 && set({ gensetCostPerKwh: v })} />
            </Field>
          ) : null}
          {result ? (
            <p className="rounded-xl bg-fuchsia-50/60 px-3.5 py-3 text-[13px] leading-relaxed text-slate-700">
              Baterai {formatDecimal(result.system.batteryKwh, 2)} kWh ({result.system.batteryModules} modul × 5,12 kWh), usable{" "}
              {formatDecimal(result.system.batteryKwh * MODEL.battery.dod, 1)} kWh — cukup untuk ±{formatDecimal(s.autonomyDays, 1)} hari tanpa matahari.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
