/**
 * Dataset lokasi & iklim surya bawaan.
 *
 * - `ghi`  : estimasi radiasi global horizontal rata-rata tahunan (kWh/m²/hari),
 *            dibulatkan dari rujukan publik (NASA POWER & Global Solar Atlas).
 * - `temp` : suhu udara rata-rata tahunan (°C).
 * - `pattern`: pola musiman regional untuk menurunkan nilai bulanan.
 *
 * Nilai ini adalah ESTIMASI untuk perhitungan awal. Server akan mencoba mengambil data
 * klimatologi NASA POWER berdasarkan koordinat bila akses internet tersedia.
 */

export type SeasonPattern =
  | "jawa-bali"
  | "nusa-tenggara"
  | "sumatra-utara"
  | "sumatra-selatan"
  | "khatulistiwa"
  | "sulawesi-selatan"
  | "sulawesi-utara"
  | "maluku"
  | "papua-selatan";

export interface City {
  id: string;
  name: string;
  province: string;
  lat: number;
  lon: number;
  /** Offset UTC zona waktu (WIB 7, WITA 8, WIT 9). */
  tz: 7 | 8 | 9;
  ghi: number;
  temp: number;
  pattern: SeasonPattern;
  aliases?: string[];
}

interface PatternDef {
  label: string;
  /** Faktor GHI Jan–Des (dinormalisasi ke rata-rata 1). */
  ghi: number[];
  /** Selisih suhu Jan–Des (°C, dinormalisasi ke rata-rata 0). */
  temp: number[];
}

const FLAT_TEMP = [-0.3, -0.1, 0.2, 0.4, 0.4, 0.2, 0, 0, 0, 0, -0.2, -0.3];

export const SEASON_PATTERNS: Record<SeasonPattern, PatternDef> = {
  "jawa-bali": {
    label: "Monsun (Jawa–Bali)",
    ghi: [0.87, 0.9, 0.95, 0.98, 0.98, 0.95, 1.0, 1.09, 1.15, 1.13, 1.03, 0.92],
    temp: [0, 0, 0.2, 0.4, 0.3, -0.2, -0.6, -0.5, 0.1, 0.5, 0.4, 0.1],
  },
  "nusa-tenggara": {
    label: "Monsun kuat (Nusa Tenggara)",
    ghi: [0.86, 0.88, 0.93, 0.99, 0.98, 0.93, 0.98, 1.08, 1.16, 1.18, 1.1, 0.93],
    temp: [0.3, 0.2, 0.3, 0.3, 0, -0.8, -1.2, -1.0, 0, 0.8, 1.0, 0.6],
  },
  "sumatra-utara": {
    label: "Utara khatulistiwa (Aceh–Sumatra Utara)",
    ghi: [1.02, 1.1, 1.08, 1.03, 1.0, 1.0, 1.0, 0.98, 0.94, 0.92, 0.93, 0.95],
    temp: FLAT_TEMP,
  },
  "sumatra-selatan": {
    label: "Monsun sedang (Sumatra bagian selatan, Kalimantan Selatan)",
    ghi: [0.92, 0.95, 0.97, 0.99, 1.01, 0.99, 1.02, 1.06, 1.07, 1.05, 1.0, 0.95],
    temp: FLAT_TEMP,
  },
  khatulistiwa: {
    label: "Khatulistiwa (relatif merata sepanjang tahun)",
    ghi: [0.96, 1.02, 1.02, 1.0, 1.0, 0.96, 0.99, 1.02, 1.03, 1.02, 0.98, 0.96],
    temp: FLAT_TEMP,
  },
  "sulawesi-selatan": {
    label: "Monsun kuat (Sulawesi bagian selatan)",
    ghi: [0.8, 0.84, 0.92, 1.0, 1.02, 0.98, 1.05, 1.13, 1.17, 1.15, 1.03, 0.85],
    temp: [-0.2, -0.2, 0, 0.3, 0.3, -0.1, -0.5, -0.3, 0.2, 0.5, 0.3, 0],
  },
  "sulawesi-utara": {
    label: "Monsun ringan (Sulawesi Utara–Maluku Utara)",
    ghi: [0.9, 0.95, 1.0, 1.02, 1.0, 0.97, 1.02, 1.07, 1.08, 1.05, 0.99, 0.93],
    temp: FLAT_TEMP,
  },
  maluku: {
    label: "Pola lokal Maluku (hujan Mei–Agustus)",
    ghi: [1.07, 1.05, 1.02, 0.97, 0.88, 0.8, 0.82, 0.9, 1.05, 1.15, 1.15, 1.1],
    temp: [0.4, 0.4, 0.4, 0.2, -0.2, -0.8, -1.0, -0.8, -0.2, 0.4, 0.6, 0.6],
  },
  "papua-selatan": {
    label: "Monsun kuat (Papua bagian selatan)",
    ghi: [0.88, 0.9, 0.95, 1.0, 0.98, 0.93, 0.96, 1.05, 1.13, 1.16, 1.1, 0.96],
    temp: [0.5, 0.4, 0.3, 0, -0.6, -1.2, -1.4, -1.0, -0.2, 0.6, 0.8, 0.7],
  },
};

type Row = [
  id: string,
  name: string,
  province: string,
  lat: number,
  lon: number,
  tz: 7 | 8 | 9,
  ghi: number,
  temp: number,
  pattern: SeasonPattern,
  aliases?: string[],
];

const ROWS: Row[] = [
  // Aceh
  ["banda-aceh", "Banda Aceh", "Aceh", 5.55, 95.32, 7, 5.0, 27.3, "sumatra-utara"],
  ["lhokseumawe", "Lhokseumawe", "Aceh", 5.18, 97.15, 7, 4.9, 27.4, "sumatra-utara"],
  ["meulaboh", "Meulaboh", "Aceh", 4.14, 96.13, 7, 4.6, 27.0, "sumatra-utara", ["Aceh Barat"]],
  // Sumatera Utara
  ["medan", "Medan", "Sumatera Utara", 3.595, 98.672, 7, 4.5, 27.3, "sumatra-utara", ["Deli Serdang", "Binjai"]],
  ["pematangsiantar", "Pematangsiantar", "Sumatera Utara", 2.96, 99.06, 7, 4.5, 24.5, "sumatra-utara", ["Siantar", "Simalungun"]],
  ["sibolga", "Sibolga", "Sumatera Utara", 1.74, 98.78, 7, 4.4, 26.8, "khatulistiwa", ["Tapanuli Tengah"]],
  ["padangsidimpuan", "Padangsidimpuan", "Sumatera Utara", 1.38, 99.27, 7, 4.5, 25.5, "khatulistiwa", ["Tapanuli Selatan"]],
  // Sumatera Barat
  ["padang", "Padang", "Sumatera Barat", -0.95, 100.35, 7, 4.6, 26.8, "khatulistiwa"],
  ["bukittinggi", "Bukittinggi", "Sumatera Barat", -0.305, 100.37, 7, 4.4, 22.0, "khatulistiwa", ["Agam"]],
  // Riau & Kepulauan Riau
  ["pekanbaru", "Pekanbaru", "Riau", 0.507, 101.448, 7, 4.6, 27.3, "khatulistiwa", ["Kampar"]],
  ["dumai", "Dumai", "Riau", 1.67, 101.45, 7, 4.7, 27.4, "khatulistiwa"],
  ["batam", "Batam", "Kepulauan Riau", 1.13, 104.05, 7, 4.7, 27.4, "khatulistiwa"],
  ["tanjung-pinang", "Tanjung Pinang", "Kepulauan Riau", 0.92, 104.45, 7, 4.7, 27.3, "khatulistiwa", ["Bintan"]],
  // Jambi
  ["jambi", "Jambi", "Jambi", -1.61, 103.61, 7, 4.6, 27.1, "khatulistiwa", ["Muaro Jambi"]],
  // Sumatera Selatan
  ["palembang", "Palembang", "Sumatera Selatan", -2.99, 104.76, 7, 4.7, 27.4, "sumatra-selatan", ["Banyuasin"]],
  ["lubuklinggau", "Lubuklinggau", "Sumatera Selatan", -3.3, 102.86, 7, 4.6, 26.0, "sumatra-selatan"],
  // Bangka Belitung
  ["pangkal-pinang", "Pangkal Pinang", "Kepulauan Bangka Belitung", -2.13, 106.11, 7, 4.9, 27.3, "sumatra-selatan", ["Bangka"]],
  ["tanjung-pandan", "Tanjung Pandan", "Kepulauan Bangka Belitung", -2.74, 107.63, 7, 4.9, 27.2, "sumatra-selatan", ["Belitung"]],
  // Bengkulu
  ["bengkulu", "Bengkulu", "Bengkulu", -3.8, 102.27, 7, 4.8, 26.9, "sumatra-selatan"],
  // Lampung
  ["bandar-lampung", "Bandar Lampung", "Lampung", -5.43, 105.26, 7, 4.8, 27.0, "sumatra-selatan", ["Lampung Selatan"]],
  ["metro", "Metro", "Lampung", -5.11, 105.31, 7, 4.8, 26.8, "sumatra-selatan", ["Lampung Tengah"]],
  // Banten
  ["serang", "Serang", "Banten", -6.12, 106.15, 7, 4.7, 27.2, "jawa-bali"],
  ["tangerang", "Tangerang", "Banten", -6.18, 106.63, 7, 4.7, 27.5, "jawa-bali", ["Kabupaten Tangerang"]],
  ["tangerang-selatan", "Tangerang Selatan", "Banten", -6.29, 106.72, 7, 4.6, 27.2, "jawa-bali", ["Tangsel", "BSD", "Serpong", "Pamulang"]],
  ["cilegon", "Cilegon", "Banten", -6.0, 106.05, 7, 4.8, 27.3, "jawa-bali"],
  // DKI Jakarta
  [
    "jakarta",
    "Jakarta",
    "DKI Jakarta",
    -6.2,
    106.83,
    7,
    4.7,
    28.0,
    "jawa-bali",
    ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur", "Jaksel", "Jakbar", "Jakut", "Jaktim", "Jakpus", "Kepulauan Seribu"],
  ],
  // Jawa Barat
  ["bandung", "Bandung", "Jawa Barat", -6.91, 107.61, 7, 4.8, 23.5, "jawa-bali", ["Kabupaten Bandung", "Bandung Barat"]],
  ["bekasi", "Bekasi", "Jawa Barat", -6.24, 107.0, 7, 4.7, 27.8, "jawa-bali"],
  ["cikarang", "Cikarang", "Jawa Barat", -6.26, 107.15, 7, 4.8, 27.6, "jawa-bali", ["Kabupaten Bekasi"]],
  ["bogor", "Bogor", "Jawa Barat", -6.6, 106.8, 7, 4.4, 25.8, "jawa-bali", ["Kabupaten Bogor", "Cibinong"]],
  ["depok", "Depok", "Jawa Barat", -6.4, 106.82, 7, 4.5, 26.8, "jawa-bali"],
  ["cimahi", "Cimahi", "Jawa Barat", -6.87, 107.54, 7, 4.8, 23.2, "jawa-bali"],
  ["cirebon", "Cirebon", "Jawa Barat", -6.71, 108.56, 7, 5.1, 27.8, "jawa-bali"],
  ["sukabumi", "Sukabumi", "Jawa Barat", -6.92, 106.93, 7, 4.5, 24.2, "jawa-bali"],
  ["tasikmalaya", "Tasikmalaya", "Jawa Barat", -7.33, 108.22, 7, 4.7, 25.0, "jawa-bali"],
  ["karawang", "Karawang", "Jawa Barat", -6.3, 107.3, 7, 4.9, 27.6, "jawa-bali"],
  ["purwakarta", "Purwakarta", "Jawa Barat", -6.56, 107.44, 7, 4.8, 26.5, "jawa-bali"],
  ["garut", "Garut", "Jawa Barat", -7.21, 107.9, 7, 4.8, 23.5, "jawa-bali"],
  // Jawa Tengah
  ["semarang", "Semarang", "Jawa Tengah", -6.97, 110.42, 7, 5.0, 28.0, "jawa-bali"],
  ["surakarta", "Surakarta (Solo)", "Jawa Tengah", -7.57, 110.82, 7, 5.0, 27.2, "jawa-bali", ["Solo", "Sukoharjo", "Karanganyar"]],
  ["tegal", "Tegal", "Jawa Tengah", -6.87, 109.14, 7, 5.1, 27.8, "jawa-bali", ["Brebes", "Slawi"]],
  ["pekalongan", "Pekalongan", "Jawa Tengah", -6.89, 109.68, 7, 5.0, 27.7, "jawa-bali", ["Batang"]],
  ["purwokerto", "Purwokerto", "Jawa Tengah", -7.42, 109.23, 7, 4.7, 26.0, "jawa-bali", ["Banyumas"]],
  ["magelang", "Magelang", "Jawa Tengah", -7.47, 110.22, 7, 4.9, 25.2, "jawa-bali"],
  ["salatiga", "Salatiga", "Jawa Tengah", -7.33, 110.5, 7, 4.9, 23.8, "jawa-bali"],
  ["kudus", "Kudus", "Jawa Tengah", -6.8, 110.84, 7, 5.1, 27.6, "jawa-bali", ["Jepara", "Pati"]],
  ["cilacap", "Cilacap", "Jawa Tengah", -7.73, 109.01, 7, 4.9, 27.0, "jawa-bali"],
  // DI Yogyakarta
  ["yogyakarta", "Yogyakarta", "DI Yogyakarta", -7.8, 110.37, 7, 5.0, 26.8, "jawa-bali", ["Jogja", "Jogjakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul"]],
  // Jawa Timur
  ["surabaya", "Surabaya", "Jawa Timur", -7.25, 112.75, 7, 5.3, 28.2, "jawa-bali"],
  ["malang", "Malang", "Jawa Timur", -7.98, 112.63, 7, 5.1, 24.0, "jawa-bali", ["Kabupaten Malang"]],
  ["batu", "Batu", "Jawa Timur", -7.87, 112.52, 7, 5.0, 21.8, "jawa-bali"],
  ["sidoarjo", "Sidoarjo", "Jawa Timur", -7.45, 112.72, 7, 5.3, 27.9, "jawa-bali"],
  ["gresik", "Gresik", "Jawa Timur", -7.16, 112.65, 7, 5.3, 28.1, "jawa-bali", ["Lamongan"]],
  ["mojokerto", "Mojokerto", "Jawa Timur", -7.47, 112.43, 7, 5.2, 27.6, "jawa-bali", ["Jombang"]],
  ["kediri", "Kediri", "Jawa Timur", -7.82, 112.01, 7, 5.1, 27.0, "jawa-bali", ["Nganjuk", "Tulungagung"]],
  ["madiun", "Madiun", "Jawa Timur", -7.63, 111.52, 7, 5.1, 27.0, "jawa-bali", ["Ngawi", "Ponorogo", "Magetan"]],
  ["blitar", "Blitar", "Jawa Timur", -8.1, 112.17, 7, 5.1, 26.8, "jawa-bali"],
  ["pasuruan", "Pasuruan", "Jawa Timur", -7.65, 112.91, 7, 5.3, 27.9, "jawa-bali"],
  ["probolinggo", "Probolinggo", "Jawa Timur", -7.75, 113.22, 7, 5.3, 27.8, "jawa-bali"],
  ["jember", "Jember", "Jawa Timur", -8.17, 113.7, 7, 5.1, 26.5, "jawa-bali", ["Lumajang", "Bondowoso"]],
  ["banyuwangi", "Banyuwangi", "Jawa Timur", -8.22, 114.37, 7, 5.3, 27.3, "jawa-bali", ["Situbondo"]],
  ["tuban", "Tuban", "Jawa Timur", -6.9, 112.05, 7, 5.4, 28.0, "jawa-bali", ["Bojonegoro"]],
  ["bangkalan", "Bangkalan", "Jawa Timur", -7.05, 112.74, 7, 5.4, 28.0, "jawa-bali", ["Madura", "Sampang", "Pamekasan"]],
  ["sumenep", "Sumenep", "Jawa Timur", -7.0, 113.86, 7, 5.5, 27.9, "jawa-bali"],
  // Bali
  ["denpasar", "Denpasar", "Bali", -8.65, 115.22, 8, 5.4, 27.6, "jawa-bali"],
  ["badung", "Badung (Kuta)", "Bali", -8.72, 115.17, 8, 5.4, 27.6, "jawa-bali", ["Kuta", "Seminyak", "Canggu", "Jimbaran", "Nusa Dua", "Mangupura"]],
  ["gianyar", "Gianyar (Ubud)", "Bali", -8.51, 115.26, 8, 5.2, 25.8, "jawa-bali", ["Ubud", "Tabanan", "Bangli"]],
  ["singaraja", "Singaraja", "Bali", -8.11, 115.09, 8, 5.6, 27.8, "jawa-bali", ["Buleleng", "Lovina"]],
  // Nusa Tenggara Barat
  ["mataram", "Mataram", "Nusa Tenggara Barat", -8.58, 116.12, 8, 5.5, 27.2, "nusa-tenggara", ["Lombok", "Lombok Barat", "Lombok Tengah", "Lombok Timur"]],
  ["sumbawa-besar", "Sumbawa Besar", "Nusa Tenggara Barat", -8.5, 117.42, 8, 5.7, 27.4, "nusa-tenggara", ["Sumbawa"]],
  ["bima", "Bima", "Nusa Tenggara Barat", -8.46, 118.73, 8, 5.8, 27.6, "nusa-tenggara", ["Dompu"]],
  // Nusa Tenggara Timur
  ["kupang", "Kupang", "Nusa Tenggara Timur", -10.18, 123.6, 8, 6.0, 27.5, "nusa-tenggara"],
  ["labuan-bajo", "Labuan Bajo", "Nusa Tenggara Timur", -8.5, 119.89, 8, 5.8, 27.6, "nusa-tenggara", ["Manggarai Barat", "Komodo"]],
  ["ende", "Ende", "Nusa Tenggara Timur", -8.84, 121.66, 8, 5.6, 27.0, "nusa-tenggara", ["Flores"]],
  ["maumere", "Maumere", "Nusa Tenggara Timur", -8.62, 122.21, 8, 5.8, 27.4, "nusa-tenggara", ["Sikka"]],
  ["waingapu", "Waingapu", "Nusa Tenggara Timur", -9.65, 120.26, 8, 6.0, 27.2, "nusa-tenggara", ["Sumba", "Sumba Timur"]],
  ["atambua", "Atambua", "Nusa Tenggara Timur", -9.11, 124.89, 8, 5.8, 26.0, "nusa-tenggara", ["Belu"]],
  // Kalimantan Barat
  ["pontianak", "Pontianak", "Kalimantan Barat", -0.03, 109.33, 7, 4.8, 27.3, "khatulistiwa", ["Kubu Raya"]],
  ["singkawang", "Singkawang", "Kalimantan Barat", 0.91, 108.98, 7, 4.8, 27.2, "khatulistiwa"],
  ["ketapang", "Ketapang", "Kalimantan Barat", -1.85, 109.98, 7, 4.8, 27.2, "khatulistiwa"],
  // Kalimantan Tengah
  ["palangka-raya", "Palangka Raya", "Kalimantan Tengah", -2.21, 113.92, 7, 4.7, 27.0, "khatulistiwa"],
  ["sampit", "Sampit", "Kalimantan Tengah", -2.53, 112.95, 7, 4.8, 27.0, "khatulistiwa", ["Kotawaringin Timur"]],
  // Kalimantan Selatan
  ["banjarmasin", "Banjarmasin", "Kalimantan Selatan", -3.32, 114.59, 8, 4.8, 27.2, "sumatra-selatan"],
  ["banjarbaru", "Banjarbaru", "Kalimantan Selatan", -3.44, 114.83, 8, 4.8, 26.8, "sumatra-selatan", ["Martapura"]],
  // Kalimantan Timur
  ["samarinda", "Samarinda", "Kalimantan Timur", -0.5, 117.15, 8, 4.7, 27.2, "khatulistiwa", ["Kutai Kartanegara", "Tenggarong"]],
  ["balikpapan", "Balikpapan", "Kalimantan Timur", -1.27, 116.83, 8, 4.8, 27.0, "khatulistiwa"],
  ["bontang", "Bontang", "Kalimantan Timur", 0.13, 117.5, 8, 4.9, 27.2, "khatulistiwa"],
  ["nusantara", "IKN Nusantara", "Kalimantan Timur", -0.97, 116.7, 8, 4.7, 26.4, "khatulistiwa", ["Ibu Kota Nusantara", "Penajam Paser Utara", "Sepaku"]],
  // Kalimantan Utara
  ["tanjung-selor", "Tanjung Selor", "Kalimantan Utara", 2.84, 117.37, 8, 4.8, 27.0, "khatulistiwa", ["Bulungan"]],
  ["tarakan", "Tarakan", "Kalimantan Utara", 3.3, 117.63, 8, 4.9, 27.3, "khatulistiwa"],
  // Sulawesi Utara & Gorontalo
  ["manado", "Manado", "Sulawesi Utara", 1.47, 124.84, 8, 5.1, 27.0, "sulawesi-utara", ["Minahasa Utara"]],
  ["bitung", "Bitung", "Sulawesi Utara", 1.44, 125.19, 8, 5.1, 27.0, "sulawesi-utara"],
  ["tomohon", "Tomohon", "Sulawesi Utara", 1.32, 124.84, 8, 4.8, 22.0, "sulawesi-utara", ["Minahasa"]],
  ["gorontalo", "Gorontalo", "Gorontalo", 0.54, 123.06, 8, 5.3, 27.2, "sulawesi-utara"],
  // Sulawesi Tengah & Barat
  ["palu", "Palu", "Sulawesi Tengah", -0.9, 119.87, 8, 5.4, 27.8, "khatulistiwa", ["Donggala", "Sigi"]],
  ["luwuk", "Luwuk", "Sulawesi Tengah", -0.95, 122.79, 8, 5.2, 27.3, "khatulistiwa", ["Banggai"]],
  ["mamuju", "Mamuju", "Sulawesi Barat", -2.68, 118.89, 8, 5.0, 27.3, "sulawesi-selatan"],
  // Sulawesi Selatan
  ["makassar", "Makassar", "Sulawesi Selatan", -5.15, 119.43, 8, 5.4, 27.4, "sulawesi-selatan", ["Gowa", "Maros"]],
  ["parepare", "Parepare", "Sulawesi Selatan", -4.01, 119.62, 8, 5.3, 27.4, "sulawesi-selatan", ["Pinrang", "Barru"]],
  ["watampone", "Watampone", "Sulawesi Selatan", -4.54, 120.33, 8, 5.2, 27.2, "sulawesi-selatan", ["Bone"]],
  ["palopo", "Palopo", "Sulawesi Selatan", -3.0, 120.2, 8, 5.0, 27.0, "sulawesi-selatan", ["Luwu"]],
  // Sulawesi Tenggara
  ["kendari", "Kendari", "Sulawesi Tenggara", -3.97, 122.51, 8, 5.1, 27.0, "sulawesi-selatan", ["Konawe"]],
  ["baubau", "Baubau", "Sulawesi Tenggara", -5.47, 122.6, 8, 5.3, 27.3, "sulawesi-selatan", ["Buton"]],
  // Maluku & Maluku Utara
  ["ambon", "Ambon", "Maluku", -3.7, 128.18, 9, 4.9, 26.8, "maluku"],
  ["tual", "Tual", "Maluku", -5.63, 132.75, 9, 5.3, 27.4, "maluku", ["Kei", "Maluku Tenggara"]],
  ["ternate", "Ternate", "Maluku Utara", 0.79, 127.38, 9, 5.2, 27.4, "sulawesi-utara"],
  ["sofifi", "Sofifi", "Maluku Utara", 0.74, 127.56, 9, 5.2, 27.2, "sulawesi-utara", ["Tidore", "Halmahera"]],
  // Papua
  ["jayapura", "Jayapura", "Papua", -2.53, 140.72, 9, 5.0, 27.4, "khatulistiwa", ["Sentani"]],
  ["manokwari", "Manokwari", "Papua Barat", -0.86, 134.06, 9, 4.8, 27.2, "khatulistiwa"],
  ["sorong", "Sorong", "Papua Barat Daya", -0.88, 131.26, 9, 4.8, 27.4, "khatulistiwa", ["Raja Ampat"]],
  ["nabire", "Nabire", "Papua Tengah", -3.37, 135.5, 9, 4.6, 27.0, "khatulistiwa"],
  ["timika", "Timika", "Papua Tengah", -4.55, 136.89, 9, 4.2, 26.5, "khatulistiwa", ["Mimika"]],
  ["wamena", "Wamena", "Papua Pegunungan", -4.09, 138.95, 9, 4.5, 19.8, "khatulistiwa", ["Jayawijaya"]],
  ["merauke", "Merauke", "Papua Selatan", -8.49, 140.4, 9, 5.3, 27.0, "papua-selatan"],
];

export const CITIES: City[] = ROWS.map(([id, name, province, lat, lon, tz, ghi, temp, pattern, aliases]) => ({
  id,
  name,
  province,
  lat,
  lon,
  tz,
  ghi,
  temp,
  pattern,
  aliases,
}));

export const DEFAULT_CITY_ID = "jakarta";

export function getCity(id: string | null | undefined): City | undefined {
  if (!id) return undefined;
  return CITIES.find((c) => c.id === id);
}

function normalizeFactors(values: number[], mode: "mean-one" | "mean-zero"): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.map((v) => (mode === "mean-one" ? v / mean : v - mean));
}

/** Nilai bulanan (12) GHI & suhu untuk sebuah kota berdasarkan pola musimannya. */
export function cityClimate(city: City): { ghi: number[]; temp: number[] } {
  const pattern = SEASON_PATTERNS[city.pattern];
  const ghiFactors = normalizeFactors(pattern.ghi, "mean-one");
  const tempOffsets = normalizeFactors(pattern.temp, "mean-zero");
  return {
    ghi: ghiFactors.map((f) => round2(city.ghi * f)),
    temp: tempOffsets.map((o) => round2(city.temp + o)),
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Jarak great-circle (km). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function nearestCity(lat: number, lon: number): { city: City; distanceKm: number } {
  let best = CITIES[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const c of CITIES) {
    const d = haversineKm(lat, lon, c.lat, c.lon);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return { city: best, distanceKm: bestD };
}

/** Perkiraan zona waktu dari bujur (untuk koordinat manual). */
export function timezoneFromLongitude(lon: number): 7 | 8 | 9 {
  if (lon >= 127) return 9;
  if (lon >= 114.5) return 8;
  return 7;
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pencarian kota berdasarkan nama, provinsi, atau alias. */
export function searchCities(query: string, limit = 12): City[] {
  const q = normalizeText(query);
  if (!q) return CITIES.slice(0, limit);
  const scored: { city: City; score: number }[] = [];
  for (const city of CITIES) {
    const name = normalizeText(city.name);
    const province = normalizeText(city.province);
    const aliases = (city.aliases ?? []).map(normalizeText);
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (aliases.some((a) => a === q)) score = 75;
    else if (aliases.some((a) => a.startsWith(q))) score = 60;
    else if (name.includes(q)) score = 50;
    else if (aliases.some((a) => a.includes(q))) score = 40;
    else if (province.startsWith(q)) score = 30;
    else if (province.includes(q)) score = 20;
    if (score > 0) scored.push({ city, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.city.name.localeCompare(b.city.name, "id"))
    .slice(0, limit)
    .map((s) => s.city);
}

/** Ringkas: jumlah kota & provinsi dalam dataset (untuk teks pemasaran). */
export const DATASET_STATS = {
  cities: CITIES.length,
  provinces: new Set(CITIES.map((c) => c.province)).size,
};
