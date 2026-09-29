export const siteConfig = {
  name: "SuryaHitung",
  tagline: "Kalkulator PLTS & Balik Modal",
  platform: "Kalkulator Energi Hijau",
  description:
    "Hitung kebutuhan PLTS atap, biaya, penghematan, dan balik modal secara lengkap — berbasis radiasi matahari per kota, tarif PLN terbaru, dan aturan PLTS atap Permen ESDM No. 2/2024.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "id_ID",
  nav: [
    { href: "/kalkulator", label: "Kalkulator" },
    { href: "/panduan", label: "Panduan PLTS" },
    { href: "/metodologi", label: "Metodologi" },
  ],
} as const;
