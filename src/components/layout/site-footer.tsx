import Link from "next/link";
import { siteConfig } from "@/config/site";
import { TARIFF_PERIOD_LABEL } from "@/lib/data/tariffs";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto bg-forest-deep text-emerald-100/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            {siteConfig.name} membantu rumah tangga dan pelaku usaha di Indonesia menghitung kebutuhan PLTS atap, penghematan, dan
            balik modal secara transparan. Modul pertama dari {siteConfig.platform}.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Jelajahi</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/kalkulator" className="hover:text-white">
                Kalkulator PLTS
              </Link>
            </li>
            <li>
              <Link href="/panduan" className="hover:text-white">
                Panduan & regulasi PLTS atap
              </Link>
            </li>
            <li>
              <Link href="/metodologi" className="hover:text-white">
                Metodologi perhitungan
              </Link>
            </li>
            <li>
              <Link href="/api/tariffs" className="hover:text-white">
                API tarif (JSON)
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Sumber data</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>Tarif PLN: {TARIFF_PERIOD_LABEL}</li>
            <li>Regulasi: Permen ESDM No. 2 Tahun 2024</li>
            <li>Radiasi: NASA POWER & estimasi regional</li>
            <li>Faktor emisi: ESDM (sistem Jawa–Madura–Bali)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs leading-relaxed text-emerald-100/60 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Hasil perhitungan adalah estimasi, bukan penawaran harga.
          </p>
          <p>Dibuat untuk mempercepat transisi energi hijau Indonesia 🌱</p>
        </div>
      </div>
    </footer>
  );
}
