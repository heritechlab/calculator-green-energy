import type { Metadata } from "next";
import Link from "next/link";
import { ENGINE_VERSION, MODEL, createDefaultInput, lossFactor } from "@/lib/engine";
import { CITIES, DATASET_STATS, SEASON_PATTERNS } from "@/lib/data/locations";
import { LOAD_PROFILES, daytimeShare, normalize } from "@/lib/data/load-profiles";
import { PANELS } from "@/lib/data/panels";
import { BATTERY_MODULE_KWH, PRICE_ANCHORS, PRICE_LAST_UPDATED, PRICE_TIERS, SYSTEM_PREMIUM_PER_KWP } from "@/lib/data/prices";
import { TARIFFS, TARIFF_PERIOD_LABEL, formatVa } from "@/lib/data/tariffs";
import { formatDecimal, formatNumber, formatPercent, formatRupiah } from "@/lib/format";

export const metadata: Metadata = {
  title: "Metodologi Perhitungan PLTS",
  description:
    "Rumus, asumsi, dan sumber data kalkulator SuryaHitung: model radiasi & produksi PV, simulasi per jam, baterai, optimasi kapasitas, analisis finansial, dan dampak lingkungan.",
  alternates: { canonical: "/metodologi" },
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-extrabold tracking-tight text-slate-900">
      {children}
    </h2>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre className="scroll-thin overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-[13px] leading-relaxed text-emerald-100">
      {children}
    </pre>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="scroll-thin overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-max border-collapse text-left text-sm tabular">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MethodologyPage() {
  const d = createDefaultInput();
  const f = d.finance;
  const l = MODEL.losses;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold tracking-wide text-emerald-700 uppercase">Transparansi</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Metodologi perhitungan</h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        Engine perhitungan (versi {ENGINE_VERSION}) ditulis sebagai modul TypeScript murni yang berjalan identik di peramban dan
        server (<code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px]">POST /api/calculate</code>). Berikut rumus,
        asumsi default, dan sumber datanya.
      </p>

      <div className="mt-12 flex flex-col gap-12 text-slate-700">
        <section className="flex flex-col gap-4">
          <H2 id="radiasi">1. Data radiasi matahari</H2>
          <p className="leading-relaxed">
            Server mencoba mengambil klimatologi bulanan <strong>NASA POWER</strong> (GHI <code>ALLSKY_SFC_SW_DWN</code> dan suhu{" "}
            <code>T2M</code>) berdasarkan koordinat, disimpan di cache 180 hari. Bila tidak tersedia, dipakai dataset bawaan{" "}
            {DATASET_STATS.cities} kota di {DATASET_STATS.provinces} provinsi: GHI rata-rata tahunan (estimasi yang dibulatkan
            dari rujukan publik NASA POWER & Global Solar Atlas) dikalikan pola musiman regional. Pengguna profesional dapat
            memasukkan nilai sendiri.
          </p>
          <Table
            head={["Pola musiman", "Jan", "Apr", "Jul", "Sep", "Des"]}
            rows={Object.values(SEASON_PATTERNS).map((p) => {
              const mean = p.ghi.reduce((a, b) => a + b, 0) / 12;
              return [p.label, ...[0, 3, 6, 8, 11].map((m) => formatDecimal(p.ghi[m] / mean, 2))];
            })}
          />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="produksi">2. Model produksi panel</H2>
          <p className="leading-relaxed">
            Untuk hari rata-rata setiap bulan (Klein, 1977), radiasi harian didistribusikan per 10 menit, ditransposisikan ke
            bidang panel, lalu dikoreksi suhu sel dan susut sistem. Waktu surya dikonversi ke jam lokal (WIB/WITA/WIT) dengan
            koreksi bujur dan equation of time.
          </p>
          <Formula>{`δ   = 23,45° · sin(360° · (284 + n) / 365)          deklinasi
ω_s = arccos(−tan φ · tan δ)                        sudut terbenam
K_T = H / H₀                                        indeks kecerahan
H_d / H = 1,311 − 3,022 K_T + 3,427 K_T² − 1,821 K_T³   (Erbs, ω_s > 81,4°)
r_t(ω) = (π/24)(a + b cos ω)(cos ω − cos ω_s)/(sin ω_s − ω_s cos ω_s)   (Collares-Pereira & Rabl)
G_T = G_b · R_b + G_d · (1 + cos β)/2 + G · ρ · (1 − cos β)/2          (isotropik, ρ = ${formatDecimal(MODEL.albedo, 1)})
T_c = T_a + (NOCT − 20)/800 · G_T                   NOCT efektif ${MODEL.noctEffective} °C
P_dc = G_T/1000 · [1 + γ(T_c − 25)] · (1 − susut lain)
P_ac = min(P_dc · η_inv, 1 / rasio DC/AC)            η_inv = ${formatPercent(MODEL.inverterEfficiency * 100, 1)}, DC/AC = ${formatDecimal(MODEL.dcAcRatio, 2)}`}</Formula>
          <Table
            head={["Susut", "Nilai"]}
            rows={[
              ["Optik/sudut datang & cahaya rendah", formatPercent(l.optical * 100, 1)],
              ["Kotoran (soiling)", formatPercent(l.soiling * 100, 1)],
              ["Mismatch & toleransi", formatPercent(l.mismatch * 100, 1)],
              ["Kabel DC", formatPercent(l.dcWiring * 100, 1)],
              ["Kabel AC", formatPercent(l.acWiring * 100, 1)],
              ["Ketersediaan sistem", formatPercent(l.availability * 100, 1)],
              ["Total (tanpa bayangan)", formatPercent((1 - lossFactor(0)) * 100, 1)],
              [
                "Degradasi",
                `${formatDecimal(f.degradationFirstYearPct, 1)}% tahun pertama, ${formatDecimal(f.degradationPct, 2)}%/tahun`,
              ],
            ]}
          />
          <Table
            head={["Panel", "Luas", "Efisiensi", "Koef. suhu"]}
            rows={PANELS.map((p) => [
              p.label,
              `${formatDecimal(p.areaM2, 2)} m²`,
              `${formatDecimal(p.efficiencyPct, 1)}%`,
              `${formatDecimal(p.tempCoeff * 100, 2)}%/°C`,
            ])}
          />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="beban">3. Profil beban & simulasi per jam</H2>
          <p className="leading-relaxed">
            Konsumsi harian tiap bulan dibagi ke 24 jam memakai profil beban. Untuk setiap tahun, bulan, dan jam: pemakaian
            langsung = min(produksi, beban); sisa produksi mengisi baterai lalu mengalir ke jaringan (tanpa kompensasi);
            kekurangan diambil dari baterai lalu PLN. Dengan baterai, hari representatif disimulasikan dari kondisi kosong hingga
            SOC tunak (konservatif).
          </p>
          <Table
            head={["Profil", "Porsi siang (06–18)"]}
            rows={LOAD_PROFILES.filter((p) => p.weights.length).map((p) => [
              p.label,
              formatPercent(daytimeShare(normalize(p.weights)) * 100),
            ])}
          />
          <p className="text-sm leading-relaxed">
            Baterai LiFePO4: modul {formatDecimal(BATTERY_MODULE_KWH, 2)} kWh, DoD {formatPercent(MODEL.battery.dod * 100)},
            efisiensi bolak-balik {formatPercent(MODEL.battery.roundTripEfficiency * 100)}, batas daya{" "}
            {formatDecimal(MODEL.battery.cRate, 1)}C, penurunan kapasitas {formatPercent(MODEL.battery.fadePerYear * 100)}/tahun,
            biaya penggantian {formatPercent(MODEL.battery.replacementCostFactor * 100)} harga awal.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="ukuran">4. Penentuan kapasitas</H2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              <strong>Optimal</strong>: seluruh jumlah panel dari 1 hingga batas (luas atap, daya tersambung ×{" "}
              {formatDecimal(MODEL.dcAcRatio, 2)}, produksi ≤ {MODEL.maxProductionRatio["on-grid"]}× konsumsi) dievaluasi selama
              umur sistem; dipilih NPV tertinggi.
            </li>
            <li>
              <strong>Target %</strong>: kapasitas terkecil yang mencapai porsi energi surya target (pencarian biner); bila tidak
              tercapai, dipakai kapasitas yang mencapai 98% porsi maksimum.
            </li>
            <li>
              <strong>Off-grid</strong>: baterai = beban harian terbesar × hari otonomi ÷ (DoD × η); PV terkecil dengan kebutuhan
              tak terpenuhi ≤ 1% per tahun dan ≤ 3% pada bulan terburuk.
            </li>
            <li>
              Inverter dipilih dari ukuran standar dengan rasio DC/AC ±{formatDecimal(MODEL.dcAcRatio, 2)}; luas atap = jumlah
              panel × luas panel × 1,2.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="biaya">5. Biaya investasi</H2>
          <p className="leading-relaxed">
            Harga sistem on-grid terpasang per kWp diinterpolasi log-linear terhadap kapasitas (kelas Standar, per{" "}
            {PRICE_LAST_UPDATED}), dikalikan kelas komponen (
            {Object.values(PRICE_TIERS)
              .map((t) => `${t.label} ×${formatDecimal(t.multiplier, 2)}`)
              .join(", ")}
            ), ditambah premi inverter hybrid {formatRupiah(SYSTEM_PREMIUM_PER_KWP.hybrid)}/kWp atau off-grid{" "}
            {formatRupiah(SYSTEM_PREMIUM_PER_KWP["off-grid"])}/kWp. Baterai default {formatRupiah(f.batteryPricePerKwh)}/kWh.
          </p>
          <Table
            head={["Kapasitas", "Harga per kWp"]}
            rows={PRICE_ANCHORS.map(([k, p]) => [`${formatNumber(k)} kWp`, formatRupiah(p)])}
          />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="finansial">6. Analisis finansial</H2>
          <Formula>{`Tarif_y     = Tarif × (1 + PBJT + PPN) × (1 + kenaikan)^(y−1)
Tagihan_sbl = max(Konsumsi, RekMin*) × Tarif_y          *hanya pascabayar
Tagihan_ssd = max(Impor − Ekspor × kompensasi, RekMin) × Tarif_y
RekMin      = ${MODEL.minimumBillHours} jam × daya (kVA)
Hemat_y     = Σ bulan (Tagihan_sbl − Tagihan_ssd)
AK_y        = Hemat_y − O&M_y − Penggantian_y ;  AK_0 = −Investasi
NPV = Σ AK_y/(1+r)^y   IRR: NPV = 0   Payback: kumulatif AK ≥ 0 (interpolasi)
LCOE = (Investasi + Σ (O&M + Penggantian)/(1+r)^y) / Σ Energi_y/(1+r)^y`}</Formula>
          <Table
            head={["Asumsi default", "Nilai"]}
            rows={[
              ["Kenaikan tarif PLN", `${f.tariffEscalationPct}%/tahun`],
              ["Inflasi O&M", `${f.inflationPct}%/tahun`],
              ["Tingkat diskonto", `${f.discountRatePct}%/tahun`],
              ["Umur analisis", `${f.lifetimeYears} tahun`],
              ["O&M", `${f.omPct}% investasi/tahun`],
              ["Penggantian inverter", `tahun ke-${f.inverterLifeYears}, ${f.inverterReplacementPct}% biaya sistem PV`],
              ["Umur baterai", `${f.batteryLifeYears} tahun`],
              ["Tanpa penggantian", `${MODEL.noReplacementFinalYears} tahun terakhir`],
              ["Pajak daerah (PBJT)", `${d.consumption.pbjtPct}% (PPN 11% untuk R-3)`],
              ["Kompensasi ekspor", `${f.exportCompensationPct}% (Permen ESDM 2/2024)`],
              ["Cicilan default", `DP ${f.downPaymentPct}%, bunga ${f.loanRatePct}%/th, tenor ${f.loanTenorYears} th (anuitas)`],
            ]}
          />
          <p className="text-sm leading-relaxed">
            Status kelayakan: <strong>Sangat layak</strong> (NPV &gt; 0 & balik modal ≤ 7 th), <strong>Layak</strong> (≤ 10 th),{" "}
            <strong>Kurang layak</strong> (NPV &gt; 0 tapi &gt; 10 th), <strong>Belum layak</strong> (NPV ≤ 0 atau tidak balik
            modal).
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="tarif">7. Tarif PLN</H2>
          <p className="leading-relaxed">
            Berlaku {TARIFF_PERIOD_LABEL}. Golongan TM/TT memakai tarif LWBP karena PLTS berproduksi di luar beban puncak.
          </p>
          <Table
            head={["Golongan", "Daya", "Rp/kWh"]}
            rows={TARIFFS.map((t) => [
              t.label.split(" · ")[0] + (t.subsidized ? " (subsidi)" : ""),
              t.vaOptions.length > 1
                ? `${formatVa(t.vaOptions[0])}–${formatVa(t.vaOptions[t.vaOptions.length - 1])}`
                : formatVa(t.defaultVa),
              formatNumber(t.rate, 2),
            ])}
          />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="lingkungan">8. Dampak lingkungan</H2>
          <p className="leading-relaxed">
            CO₂ dihindari = energi surya yang dipakai × faktor emisi grid ({formatDecimal(f.emissionFactor, 2)} kg CO₂/kWh, sistem
            Jawa–Madura–Bali, ESDM) atau {formatDecimal(MODEL.gensetKgCo2PerKwh, 1)} kg CO₂/kWh untuk genset diesel. Setara pohon
            = CO₂ ÷ {MODEL.treeKgCo2PerYear} kg per pohon per tahun; setara mobil = CO₂ ÷ {formatDecimal(MODEL.carKgCo2PerKm, 2)}{" "}
            kg per km.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="validasi">9. Validasi & batasan</H2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              Uji otomatis memeriksa keseimbangan energi per jam, normalisasi radiasi, PR 0,72–0,85 dan specific yield wajar untuk
              seluruh {CITIES.length} kota, serta NPV/IRR/anuitas terhadap nilai acuan.
            </li>
            <li>
              Model memakai hari representatif per bulan (bukan data 8.760 jam), sehingga rangkaian hari mendung hanya didekati
              melalui hari otonomi baterai.
            </li>
            <li>Bayangan dimodelkan sebagai persentase susut; kondisi atap nyata perlu disurvei.</li>
            <li>Harga pasar bervariasi ±20%; gunakan harga penawaran installer untuk hasil yang lebih presisi.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="api">10. API publik</H2>
          <p className="leading-relaxed">Hasil yang sama dapat diperoleh lewat API (input parsial dilengkapi nilai default):</p>
          <Formula>{`curl -X POST ${"{SITE}"}/api/calculate?view=summary \\
  -H "content-type: application/json" \\
  -d '{"location":{"cityId":"surabaya"},"consumption":{"tariffId":"R2","monthlyBill":2500000}}'`}</Formula>
          <p className="text-sm">
            Endpoint lain: <code>GET /api/irradiance?lat=&amp;lon=</code>, <code>GET /api/locations?q=</code>,{" "}
            <code>GET /api/tariffs</code>, <code>POST /api/reports</code>, <code>GET /api/reports/{"{id}"}</code>,{" "}
            <code>GET /api/health</code>.
          </p>
        </section>

        <p className="rounded-2xl bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-950">
          Siap mencoba?{" "}
          <Link href="/kalkulator" className="font-semibold underline underline-offset-2">
            Buka kalkulator
          </Link>{" "}
          — semua asumsi di atas bisa diubah pada langkah “Biaya & Pembiayaan”.
        </p>
      </div>
    </div>
  );
}
