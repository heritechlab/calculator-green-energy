"use client";

import { useState } from "react";
import { Compass, Crosshair, Home, Loader2, Ruler, Satellite, Sun } from "lucide-react";
import { useCalculatorStore } from "@/store/calculator";
import { useIrradianceStatus } from "@/hooks/use-irradiance-sync";
import { ORIENTATION_LABELS, type Orientation } from "@/lib/engine";
import { formatDecimal } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChoiceCards, Segmented, Slider } from "@/components/ui/choice";
import { Field, SectionTitle } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/inputs";
import { Accordion } from "@/components/ui/overlay";
import { NativeSelect } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { CityCombobox } from "../city-combobox";
import { IrradianceBars } from "../mini-charts";

const ROOF_PRESETS = [
  { value: "10", label: "Dak beton", description: "Rangka ±10°" },
  { value: "15", label: "Atap landai", description: "±15° (metal/spandek)" },
  { value: "25", label: "Atap miring", description: "±25° (genteng/metal)" },
  { value: "35", label: "Atap curam", description: "±35° (genteng)" },
];

const SHADING = [
  { value: "0", label: "Tidak ada" },
  { value: "5", label: "Sedikit (5%)" },
  { value: "10", label: "Sedang (10%)" },
  { value: "20", label: "Banyak (20%)" },
];

function SourceBadge() {
  const status = useIrradianceStatus((s) => s.status);
  const source = useCalculatorStore((s) => s.input.location.source);
  if (source === "manual") return <Badge tone="slate">Input manual</Badge>;
  if (status === "loading")
    return (
      <Badge tone="slate">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Mengambil data satelit…
      </Badge>
    );
  if (source === "nasa-power")
    return (
      <Badge tone="sky">
        <Satellite className="h-3 w-3" aria-hidden /> Data satelit NASA POWER
      </Badge>
    );
  return <Badge tone="amber">Estimasi regional</Badge>;
}

export function LocationStep() {
  const location = useCalculatorStore((s) => s.input.location);
  const roof = useCalculatorStore((s) => s.input.roof);
  const setCity = useCalculatorStore((s) => s.setCity);
  const setCoordinates = useCalculatorStore((s) => s.setCoordinates);
  const update = useCalculatorStore((s) => s.update);
  const [locating, setLocating] = useState(false);
  const [dims, setDims] = useState<{ l: number | null; w: number | null }>({ l: null, w: null });
  const [coords, setCoords] = useState({ lat: location.lat, lon: location.lon });

  const avg = location.ghi.reduce((a, b) => a + b, 0) / 12;
  const presetValue = ROOF_PRESETS.some((p) => Number(p.value) === roof.tiltDeg) ? String(roof.tiltDeg) : "";

  const locate = () => {
    if (!("geolocation" in navigator)) {
      toast("Peramban tidak mendukung lokasi otomatis", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        if (latitude < -11.5 || latitude > 6.5 || longitude < 94.5 || longitude > 141.5) {
          toast("Lokasi Anda di luar Indonesia — pilih kota secara manual", "error");
          return;
        }
        setCoordinates(latitude, longitude);
        setCoords({ lat: latitude, lon: longitude });
        toast("Lokasi ditemukan");
      },
      () => {
        setLocating(false);
        toast("Izin lokasi ditolak atau tidak tersedia", "error");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Lokasi */}
      <section className="flex flex-col gap-4">
        <SectionTitle icon={<Sun className="h-5 w-5" aria-hidden />} title="Lokasi pemasangan" description="Semakin tinggi radiasi matahari, semakin banyak listrik per panel." />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <CityCombobox
            id="city"
            selectedName={location.name}
            onSelect={(city) => {
              setCity(city.id);
              setCoords({ lat: city.lat, lon: city.lon });
            }}
          />
          <Button variant="secondary" onClick={locate} disabled={locating} className="h-12">
            {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Crosshair className="h-4 w-4" aria-hidden />}
            Gunakan lokasi saya
          </Button>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {location.name}
                {location.province ? <span className="font-medium text-slate-500">, {location.province}</span> : null}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDecimal(location.lat, 3)}°, {formatDecimal(location.lon, 3)}° · WI{location.utcOffset === 7 ? "B" : location.utcOffset === 8 ? "TA" : "T"}
              </p>
            </div>
            <SourceBadge />
          </div>
          <div className="mt-4 grid items-end gap-4 sm:grid-cols-[auto_1fr]">
            <div>
              <p className="text-xs font-medium text-slate-500">Radiasi rata-rata</p>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {formatDecimal(avg, 2)}
                <span className="ml-1 text-sm font-semibold text-slate-500">kWh/m²/hari</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">≈ {formatDecimal(avg, 1)} jam matahari puncak per hari</p>
            </div>
            <IrradianceBars values={location.ghi} label={`Radiasi matahari bulanan di ${location.name} (kWh/m²/hari)`} />
          </div>
        </div>

        <Accordion
          items={[
            {
              value: "coords",
              title: "Koordinat & data radiasi manual",
              subtitle: "Untuk pengguna profesional",
              content: (
                <div className="flex flex-col gap-5">
                  <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <Field label="Lintang (latitude)" htmlFor="lat">
                      <NumberInput id="lat" value={coords.lat} decimals={4} min={-11.5} max={6.5} onValueChange={(v) => v !== null && setCoords((c) => ({ ...c, lat: v }))} />
                    </Field>
                    <Field label="Bujur (longitude)" htmlFor="lon">
                      <NumberInput id="lon" value={coords.lon} decimals={4} min={94.5} max={141.5} onValueChange={(v) => v !== null && setCoords((c) => ({ ...c, lon: v }))} />
                    </Field>
                    <Button variant="outline" className="h-12" onClick={() => setCoordinates(coords.lat, coords.lon)}>
                      Terapkan
                    </Button>
                  </div>
                  <Field
                    label="Radiasi rata-rata manual"
                    htmlFor="psh"
                    info="Masukkan nilai dari studi lokasi, PVGIS, atau Global Solar Atlas. Pola bulanan akan diskalakan mengikuti nilai ini."
                    hint="Nilai umum di Indonesia 4,0–6,0 kWh/m²/hari."
                  >
                    <NumberInput
                      id="psh"
                      value={Math.round(avg * 100) / 100}
                      decimals={2}
                      min={2.5}
                      max={8}
                      suffix="kWh/m²/hari"
                      onValueChange={(v) => {
                        if (v === null || v < 2.5 || v > 8) return;
                        const factor = v / avg;
                        update("location", { ghi: location.ghi.map((g) => Math.round(g * factor * 100) / 100), source: "manual" });
                      }}
                    />
                  </Field>
                  {location.source === "manual" && location.cityId ? (
                    <Button variant="ghost" size="sm" className="self-start" onClick={() => setCity(location.cityId!)}>
                      Kembalikan data kota
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* Atap */}
      <section className="flex flex-col gap-5">
        <SectionTitle icon={<Home className="h-5 w-5" aria-hidden />} title="Kondisi atap" description="Kemiringan, arah, dan bayangan memengaruhi produksi hingga belasan persen." />

        <Field
          label="Luas atap yang tersedia"
          htmlFor="roof-area"
          info="Luas bagian atap yang bebas bayangan dan bisa dipasangi panel. Kosongkan bila belum tahu — kalkulator akan menampilkan luas yang dibutuhkan."
          hint="Opsional. Setiap panel 550 Wp butuh ±3,1 m² termasuk ruang perawatan."
        >
          <NumberInput
            id="roof-area"
            value={roof.areaM2}
            allowEmpty
            decimals={1}
            min={1}
            max={1_000_000}
            suffix="m²"
            placeholder="Tidak dibatasi"
            onValueChange={(v) => update("roof", { areaM2: v !== null && v >= 1 ? v : null })}
          />
        </Field>
        <div className="-mt-2 flex flex-wrap items-end gap-2 rounded-2xl bg-slate-50 p-3">
          <Ruler className="mb-3 h-4 w-4 text-slate-400" aria-hidden />
          <label className="flex w-28 flex-col gap-1 text-xs font-medium text-slate-600">
            Panjang (m)
            <NumberInput value={dims.l} allowEmpty decimals={1} min={0} className="h-10 text-sm" onValueChange={(v) => setDims((d) => ({ ...d, l: v }))} />
          </label>
          <span className="mb-2.5 text-slate-400">×</span>
          <label className="flex w-28 flex-col gap-1 text-xs font-medium text-slate-600">
            Lebar (m)
            <NumberInput value={dims.w} allowEmpty decimals={1} min={0} className="h-10 text-sm" onValueChange={(v) => setDims((d) => ({ ...d, w: v }))} />
          </label>
          <Button
            variant="outline"
            size="sm"
            className="mb-0.5 h-10"
            disabled={!dims.l || !dims.w}
            onClick={() => dims.l && dims.w && update("roof", { areaM2: Math.round(dims.l * dims.w * 10) / 10 })}
          >
            Pakai luas ini
          </Button>
        </div>

        <Field label="Jenis & kemiringan atap" asGroup info="Di Indonesia (dekat khatulistiwa) kemiringan ideal 5–15°. Kemiringan lebih curam sedikit menurunkan produksi namun membantu membersihkan debu saat hujan.">
          <ChoiceCards
            compact
            ariaLabel="Jenis atap"
            value={presetValue}
            onValueChange={(v) => update("roof", { tiltDeg: Number(v) })}
            options={ROOF_PRESETS}
            className="grid-cols-2 sm:grid-cols-4"
          />
          <div className="mt-2 flex items-center gap-4">
            <Slider ariaLabel="Kemiringan panel" value={roof.tiltDeg} min={0} max={45} step={1} onValueChange={(v) => update("roof", { tiltDeg: v })} />
            <span className="w-14 shrink-0 text-right text-sm font-bold text-slate-800 tabular">{roof.tiltDeg}°</span>
          </div>
        </Field>

        <div className="grid gap-5">
          <Field
            label="Arah hadap panel"
            htmlFor="orientation"
            info="Panel sebaiknya menghadap khatulistiwa: ke utara bila lokasi di selatan khatulistiwa (mis. Jawa), ke selatan bila di utara khatulistiwa (mis. Medan)."
          >
            <div className="relative">
              <NativeSelect id="orientation" value={roof.orientation} onChange={(e) => update("roof", { orientation: e.target.value as Orientation })}>
                {(Object.keys(ORIENTATION_LABELS) as Orientation[]).map((o) => (
                  <option key={o} value={o}>
                    {ORIENTATION_LABELS[o]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </Field>
          <Field label="Bayangan pada atap" asGroup info="Bayangan dari pohon, gedung, atau tangki air mengurangi produksi. Pilih perkiraan terbaik Anda.">
            <Segmented
              ariaLabel="Tingkat bayangan"
              value={String(roof.shadingPct)}
              onValueChange={(v) => update("roof", { shadingPct: Number(v) })}
              options={SHADING}
              className="grid-flow-row grid-cols-2 sm:grid-flow-col sm:grid-cols-none"
            />
          </Field>
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-emerald-50/70 px-3.5 py-3 text-[13px] leading-relaxed text-emerald-900">
          <Compass className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Tips: atap yang menghadap timur–barat tetap layak — produksinya hanya ±2–4% lebih rendah dari arah optimal di
          wilayah dekat khatulistiwa.
        </p>
      </section>
    </div>
  );
}
