# PRD — SuryaHitung: Kalkulator Kebutuhan PLTS & Estimasi Balik Modal

| Atribut | Keterangan |
| --- | --- |
| Produk | **SuryaHitung** (nama kerja) — modul pertama platform *Kalkulator Energi Hijau* |
| Fokus fase ini | PLTS (Pembangkit Listrik Tenaga Surya) atap: on-grid, hybrid, off-grid |
| Versi dokumen | 1.0 |
| Tanggal | 29 September 2026 |
| Status | Disetujui untuk MVP (dokumen hidup, diperbarui tiap rilis) |
| Pemilik | heritechlab |
| Bahasa produk | Bahasa Indonesia |

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Masalah](#2-latar-belakang--masalah)
3. [Tujuan, Sasaran & Non-Tujuan](#3-tujuan-sasaran--non-tujuan)
4. [Persona Pengguna](#4-persona-pengguna)
5. [User Stories](#5-user-stories)
6. [Ruang Lingkup & Prioritas (MoSCoW)](#6-ruang-lingkup--prioritas-moscow)
7. [Alur Pengguna](#7-alur-pengguna)
8. [Kebutuhan Fungsional](#8-kebutuhan-fungsional)
9. [Metodologi Perhitungan](#9-metodologi-perhitungan)
10. [Data Referensi & Sumber](#10-data-referensi--sumber)
11. [Desain UX/UI](#11-desain-uxui)
12. [Arsitektur Teknis](#12-arsitektur-teknis)
13. [Kebutuhan Non-Fungsional](#13-kebutuhan-non-fungsional)
14. [Analitik & Metrik Keberhasilan](#14-analitik--metrik-keberhasilan)
15. [Strategi Pengujian](#15-strategi-pengujian)
16. [Risiko & Mitigasi](#16-risiko--mitigasi)
17. [Rencana Rilis & Milestone](#17-rencana-rilis--milestone)
18. [Pertanyaan Terbuka](#18-pertanyaan-terbuka)
19. [Disclaimer](#19-disclaimer)
20. [Lampiran: Glosarium](#20-lampiran-glosarium)

---

## 1. Ringkasan Eksekutif

SuryaHitung adalah aplikasi web *full stack* yang membantu rumah tangga, pelaku usaha, dan installer menjawab tiga pertanyaan utama sebelum memasang PLTS atap:

1. **Berapa kapasitas PLTS yang saya butuhkan?** (kWp, jumlah panel, inverter, baterai, luas atap)
2. **Berapa biaya dan penghematannya?** (investasi awal, hemat per bulan, tagihan sebelum vs sesudah)
3. **Kapan balik modal dan seberapa menguntungkan?** (payback, ROI, NPV, IRR, LCOE, arus kas 25 tahun, opsi cicilan)

Pembeda utama dibanding kalkulator sederhana yang beredar:

- **Sadar regulasi terbaru** — memakai aturan Permen ESDM No. 2 Tahun 2024: kelebihan listrik yang diekspor ke PLN **tidak lagi mengurangi tagihan**, sehingga ukuran sistem dioptimalkan untuk *konsumsi sendiri* (self-consumption), bukan sekadar "produksi = konsumsi".
- **Simulasi per jam** — produksi panel (dari model posisi matahari & radiasi per kota) dicocokkan dengan pola pemakaian listrik 24 jam, sehingga porsi listrik yang benar-benar terpakai (dan yang terbuang) terhitung realistis.
- **Optimasi kapasitas otomatis** — mencari ukuran dengan nilai ekonomi terbaik (NPV maksimum), sekaligus menampilkan alternatif (balik modal tercepat, cakupan maksimal).
- **Lengkap tapi ramah awam** — mode *Hitung Cepat* (3 isian) untuk pemula, mode *Detail* (wizard 4 langkah) dengan pengaturan lanjutan untuk profesional; semua asumsi transparan dan bisa diubah.
- **Hijau, cepat, dan mobile-first** — antarmuka bernuansa hijau yang nyaman di ponsel maupun desktop, hasil bisa disimpan, dibagikan lewat tautan, dan dicetak/diunduh sebagai PDF.

---

## 2. Latar Belakang & Masalah

### 2.1 Konteks

- Indonesia memiliki potensi energi surya tinggi: rata-rata radiasi harian ±4,5–6 kWh/m²/hari (tertinggi di Nusa Tenggara, terendah di wilayah bercurah hujan tinggi seperti Bogor & pegunungan Papua).
- Tarif listrik PLN nonsubsidi rumah tangga saat ini Rp1.444,70–Rp1.699,53/kWh (ditetapkan tetap untuk triwulan III 2026).
- **Permen ESDM No. 2 Tahun 2024** tentang PLTS Atap mengubah aturan main:
  - Kelebihan energi yang masuk ke jaringan **tidak diperhitungkan** dalam tagihan (skema ekspor–impor/net-metering dihapus).
  - Kapasitas tidak lagi dibatasi 100% daya tersambung secara individual, **tetapi mengikuti kuota** pengembangan PLTS atap per sistem/klaster yang ditetapkan PLN.
  - Biaya kapasitas (*capacity charge*) dihapus.
  - Pelanggan PLTS atap adalah pelanggan **pascabayar**; meter disediakan PLN.

### 2.2 Masalah pengguna

| # | Masalah | Dampak |
| --- | --- | --- |
| P1 | Awam tidak tahu cara menerjemahkan tagihan listrik menjadi kebutuhan kWp | Tidak berani memulai, atau percaya angka penjual begitu saja |
| P2 | Banyak kalkulator masih memakai asumsi net-metering lama | Sistem *oversize*, balik modal yang dijanjikan tidak tercapai |
| P3 | Pola pemakaian siang vs malam jarang diperhitungkan | Estimasi penghematan terlalu optimistis untuk rumah yang kosong di siang hari |
| P4 | Analisis finansial minim (hanya "balik modal X tahun") | Pelaku usaha tidak punya NPV/IRR/arus kas untuk keputusan investasi atau pengajuan kredit |
| P5 | Tidak ada perbandingan on-grid vs hybrid vs off-grid | Salah pilih jenis sistem, baterai dibeli padahal tidak ekonomis (atau sebaliknya) |
| P6 | Hasil sulit dibagikan ke keluarga/partner/bank | Proses keputusan lambat |

---

## 3. Tujuan, Sasaran & Non-Tujuan

### 3.1 Tujuan produk

- **G1** — Pengguna awam mendapatkan estimasi kebutuhan PLTS dan balik modal dalam **≤ 2 menit** (mode cepat ≤ 30 detik).
- **G2** — Estimasi **akurat & transparan**: selisih produksi energi tahunan ≤ ±10% dibanding perangkat lunak rujukan (PVGIS/PVsyst) untuk lokasi yang sama; seluruh asumsi dapat dilihat dan diubah.
- **G3** — Pengalaman **mobile-first** yang menyenangkan dengan identitas visual hijau (energi bersih).
- **G4** — Hasil dapat **disimpan, dibagikan, dan dicetak** sebagai laporan profesional.
- **G5** — Fondasi arsitektur yang siap diperluas ke jenis energi hijau lain (PLTB, pemanas air surya, biogas, kendaraan listrik).

### 3.2 Sasaran terukur (3 bulan setelah rilis)

| Metrik | Target |
| --- | --- |
| Rasio penyelesaian (mulai → melihat hasil) | ≥ 60% |
| Median waktu hingga hasil (mode cepat) | ≤ 45 detik |
| Rasio simpan/bagikan dari yang melihat hasil | ≥ 15% |
| Lighthouse Performance (mobile) | ≥ 85 |
| Lighthouse Accessibility | ≥ 95 |
| Waktu perhitungan di peramban (perangkat menengah) | ≤ 100 ms |

### 3.3 Non-tujuan (di luar cakupan MVP)

- Desain elektrikal detail (konfigurasi string, tegangan MPPT, penampang kabel) dan analisis bayangan 3D.
- Data radiasi per jam aktual (TMY/8760 jam) — MVP memakai hari representatif per bulan.
- Marketplace, pemesanan, atau pembayaran online.
- Akun pengguna/login (MVP tanpa login; tautan berbagi bersifat publik-tak-terdaftar).
- Modul energi hijau selain PLTS (dirancang agar mudah ditambah di fase berikutnya).

---

## 4. Persona Pengguna

| Persona | Profil | Kebutuhan utama | Frustrasi |
| --- | --- | --- | --- |
| **Budi — Pemilik rumah** | 38 th, Bekasi, R-1 2.200 VA, tagihan ±Rp900 rb/bln, kerja kantoran | Jawaban sederhana: berapa biaya, hemat berapa, kapan balik modal | Istilah teknis (kWp, PSH), takut tertipu penjual |
| **Sari — Pemilik usaha** | 45 th, minimarket & ruko di Makassar, B-2 23 kVA, operasi 07–22 | ROI, NPV, IRR, opsi cicilan, laporan untuk bank/mitra | Kalkulator terlalu sederhana, tidak bisa ubah asumsi |
| **Andi — Installer/konsultan** | 30 th, sales engineer EPC PLTS di Surabaya | Estimasi cepat untuk calon klien, harga bisa disesuaikan, laporan PDF & tautan | Harus membuat proposal manual di spreadsheet |
| **Rina — Mahasiswa/peneliti** | 22 th, teknik elektro | Metodologi & rumus yang transparan | Kalkulator "kotak hitam" |

---

## 5. User Stories

Prioritas: **M** = Must, **S** = Should, **C** = Could.

| ID | Sebagai … | Saya ingin … | Agar … | Prioritas |
| --- | --- | --- | --- | --- |
| US-01 | pemilik rumah | memasukkan tagihan bulanan & kota saja | langsung tahu kebutuhan PLTS dan balik modal | M |
| US-02 | pengguna | memilih lokasi dari daftar kota atau memakai lokasi saya | data radiasi sesuai daerah saya | M |
| US-03 | pengguna | memilih golongan tarif & daya PLN | penghematan dihitung dengan tarif yang benar | M |
| US-04 | pengguna | memilih pola pemakaian (siang/malam) | estimasi self-consumption realistis | M |
| US-05 | pengguna | membandingkan on-grid, hybrid, off-grid | memilih jenis sistem yang tepat | M |
| US-06 | pengguna | melihat rekomendasi kWp, jumlah panel, inverter, baterai, luas atap | tahu spesifikasi yang harus diminta ke installer | M |
| US-07 | pengguna | melihat investasi, hemat per bulan, tagihan sebelum/sesudah, payback, ROI | memutuskan layak atau tidak | M |
| US-08 | pelaku usaha | melihat NPV, IRR, LCOE, arus kas 25 tahun | analisis investasi yang lengkap | M |
| US-09 | pengguna | mengubah asumsi (harga/kWp, kenaikan tarif, degradasi, dll.) | hasil sesuai kondisi saya | M |
| US-10 | pengguna | melihat grafik produksi vs konsumsi (bulanan & harian) | memahami kapan PLTS bekerja | M |
| US-11 | pengguna | melihat dampak lingkungan (CO₂, setara pohon) | termotivasi beralih ke energi hijau | M |
| US-12 | pengguna | menyimpan hasil & membagikan tautannya | berdiskusi dengan keluarga/partner | M |
| US-13 | pengguna | mencetak/mengunduh laporan PDF | lampiran proposal/pengajuan kredit | M |
| US-14 | pengguna | membaca panduan PLTS & aturan terbaru | memahami langkah pemasangan | M |
| US-15 | pengguna | mensimulasikan pembelian dengan cicilan | membandingkan cicilan vs penghematan | S |
| US-16 | pengguna | melihat pilihan kapasitas lain (grafik kWp vs payback) | memilih sesuai anggaran | S |
| US-17 | pengguna | melihat analisis sensitivitas | memahami risiko asumsi | S |
| US-18 | pengguna | membatasi kapasitas dengan luas atap | rekomendasi muat di atap saya | S |
| US-19 | pengguna | memasukkan pemakaian kWh per bulan (12 bulan) | akurasi lebih tinggi untuk pemakaian musiman | S |
| US-20 | developer/mitra | memanggil API perhitungan | mengintegrasikan ke sistem sendiri | S |
| US-21 | pengguna | melihat riwayat perhitungan di perangkat saya | kembali ke hasil sebelumnya | C |
| US-22 | pengguna | meminta penawaran ke installer | langsung ditindaklanjuti | C (Fase 2) |

---

## 6. Ruang Lingkup & Prioritas (MoSCoW)

### 6.1 MVP (Fase 1 — rilis ini)

**Must have**
- Landing page + *Hitung Cepat* inline (tagihan + kota + daya → estimasi instan).
- Wizard *Hitung Detail* 4 langkah (Lokasi & Atap → Pemakaian Listrik → Sistem PLTS → Biaya & Pembiayaan) dengan ringkasan live.
- Engine perhitungan: model radiasi, simulasi per jam, baterai, optimasi kapasitas, finansial, lingkungan.
- Dashboard hasil: KPI, rekomendasi sistem, grafik energi, grafik & tabel keuangan, dampak lingkungan, asumsi.
- Perbandingan jenis sistem (on-grid / hybrid / off-grid).
- Simpan & bagikan (database) + halaman hasil publik `/hasil/[id]`.
- Cetak / unduh PDF (tata letak cetak khusus).
- Halaman Panduan (termasuk regulasi & FAQ) dan Metodologi.
- API: `calculate`, `irradiance`, `locations`, `tariffs`, `reports`, `health`.

**Should have**
- Simulasi cicilan/kredit.
- Grafik pilihan kapasitas (kWp vs payback/NPV) dan tombol "pakai ukuran ini".
- Analisis sensitivitas (tornado).
- Batas luas atap, input 12 bulan pemakaian.
- Data radiasi NASA POWER berdasarkan koordinat (dengan cache & fallback).
- Riwayat perhitungan lokal (localStorage).

**Could have**
- Gambar OG dinamis untuk tautan hasil.
- Mode gelap.

### 6.2 Fase 2 (setelah MVP)
- Form "Minta Penawaran" + dasbor admin (leads, pembaruan tarif/harga tanpa deploy).
- Pemilih lokasi berbasis peta, dan estimasi luas atap dari peta.
- PDF server-side bermerek, bahasa Inggris, mode gelap, analitik produk.

### 6.3 Fase 3
- Modul energi hijau lain: PLTB skala kecil, pemanas air surya, biogas, pengisian kendaraan listrik.
- Direktori installer terverifikasi & perbandingan penawaran.

---

## 7. Alur Pengguna

```
                 ┌──────────────┐
                 │  Landing (/) │
                 └──────┬───────┘
         ┌──────────────┼───────────────────┐
         ▼              ▼                   ▼
  Hitung Cepat     Hitung Detail       Panduan / Metodologi
  (inline, 3 isian) (/kalkulator)       (/panduan, /metodologi)
         │              │
         │   1. Lokasi & Atap
         │   2. Pemakaian Listrik
         │   3. Sistem PLTS
         │   4. Biaya & Pembiayaan
         │              │   (ringkasan live di setiap langkah)
         └──────┬───────┘
                ▼
       Dashboard Hasil (/kalkulator#hasil)
       ├─ Ubah data (kembali ke langkah mana pun, data tetap)
       ├─ Pilih ukuran lain / jenis sistem lain (hitung ulang instan)
       ├─ Simpan & Bagikan ──► /hasil/{id} (publik, bisa dibuka siapa saja)
       └─ Cetak / Unduh PDF
```

Prinsip alur:
- Semua isian punya **nilai default yang masuk akal**, sehingga pengguna bisa langsung "Lanjut" tanpa berhenti.
- Data wizard disimpan otomatis di perangkat (draft), sehingga menutup tab tidak menghilangkan isian.
- Navigasi langkah bisa maju-mundur bebas; indikator langkah dapat diklik.

---

## 8. Kebutuhan Fungsional

### 8.1 Landing page & Hitung Cepat (FR-LP)

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| FR-LP-01 | Hero dengan proposisi nilai + CTA "Mulai Hitung" dan "Hitung Cepat" | CTA terlihat tanpa scroll di layar 360×640 |
| FR-LP-02 | Widget Hitung Cepat: tagihan bulanan (Rp), kota, golongan/daya | Hasil ringkas (kWp, investasi, hemat/bulan, balik modal) muncul < 300 ms setelah input berubah |
| FR-LP-03 | Tombol "Lihat analisis lengkap" membawa isian ke wizard/hasil | Isian terbawa tanpa mengetik ulang |
| FR-LP-04 | Seksi: cara kerja, keunggulan, info regulasi, FAQ ringkas, teaser modul energi hijau lain | Responsif 360–1920 px |

### 8.2 Wizard Hitung Detail (FR-WZ)

**Langkah 1 — Lokasi & Atap**

| Field | Tipe | Default | Validasi / keterangan |
| --- | --- | --- | --- |
| Kota/kabupaten | Combobox pencarian (±110 kota) | Jakarta | Wajib. Menampilkan radiasi rata-rata (jam matahari efektif) & grafik mini 12 bulan |
| Gunakan lokasi saya | Tombol geolokasi | – | Mengisi koordinat, memilih kota terdekat, mencoba data NASA POWER |
| Koordinat manual | Lat/Lon (lanjutan) | dari kota | Lat −11…6, Lon 95…141 |
| Luas atap tersedia | Angka (m²), opsional | kosong = tidak dibatasi | 0–100.000 m² |
| Jenis/kemiringan atap | Pilihan: Dak beton (rangka 10°), Atap landai (15°), Atap miring (25°), Atap curam (35°), Kustom | Atap landai 15° | Kemiringan 0–60° |
| Arah hadap panel | Pilihan: Optimal (menghadap khatulistiwa), U, TL, T, TG, S, BD, B, BL, Timur–Barat | Optimal | Dikonversi ke azimut |
| Bayangan | Pilihan: Tidak ada (0%), Sedikit (5%), Sedang (10%), Banyak (20%) | Tidak ada | Susut tambahan |

**Langkah 2 — Pemakaian Listrik**

| Field | Tipe | Default | Validasi / keterangan |
| --- | --- | --- | --- |
| Kategori pelanggan | Segmented: Rumah tangga / Bisnis / Industri / Lainnya | Rumah tangga | – |
| Golongan & daya | Select | R-1 2.200 VA | Menentukan tarif, PPN, dan rekening minimum |
| Tarif kustom | Angka Rp/kWh | tarif golongan | Aktif jika "Lainnya" |
| Cara input | Toggle: Tagihan (Rp) / Pemakaian (kWh) / 12 bulan (kWh) | Tagihan | – |
| Tagihan per bulan | Rupiah | Rp1.000.000 | Rp50.000–Rp10 miliar |
| Pemakaian per bulan | kWh | – | 10–10.000.000 kWh |
| Pola pemakaian | Kartu pilihan + grafik mini 24 jam | Rumah tangga — aktif pagi & malam | 5 templat + kustom |
| Porsi pemakaian siang (06–18) | Slider % | dari templat | 10–90% (mode kustom) |
| Jenis meter saat ini | Prabayar / Pascabayar | Prabayar | Rekening minimum untuk pascabayar |
| Pajak daerah (PBJT/PPJ) | % (lanjutan) | 3% | 0–10% |
| Pertumbuhan pemakaian | %/tahun (lanjutan) | 0% | 0–10% |

**Langkah 3 — Sistem PLTS**

| Field | Tipe | Default | Validasi / keterangan |
| --- | --- | --- | --- |
| Jenis sistem | Kartu: On-grid / Hybrid / Off-grid (dengan kelebihan–kekurangan) | On-grid | – |
| Strategi ukuran | Segmented: Optimal (NPV terbaik) / Target % kebutuhan / Manual | Optimal | – |
| Target porsi energi surya | Slider % | 50% | 10–100% (mode target) |
| Kapasitas manual | kWp | – | 0,3–10.000 kWp (mode manual) |
| Panel | Pilihan: 450, 550, 580, 620, 700 Wp | 550 Wp | Menentukan luas per panel |
| Batasi ≤ daya tersambung | Switch (on-grid/hybrid) | Aktif | Batas praktis inverter ≈ daya PLN |
| Tujuan baterai | Hybrid: Simpan surplus / Cadangan saat padam / Manual | Simpan surplus | – |
| Cadangan padam | jam × watt beban esensial | 4 jam × 500 W | Mode cadangan |
| Kapasitas baterai manual | kWh | – | Mode manual |
| Hari otonomi | hari | 1 | Off-grid, 0,5–5 |
| Sumber listrik pembanding | Off-grid: PLN / Genset | PLN | Genset Rp6.000/kWh (dapat diubah) |

**Langkah 4 — Biaya & Pembiayaan**

| Field | Tipe | Default | Validasi / keterangan |
| --- | --- | --- | --- |
| Kelas komponen | Ekonomis / Standar / Premium | Standar | Pengali harga 0,85 / 1,0 / 1,2 |
| Harga sistem per kWp | Rupiah (otomatis, bisa diubah) | kurva harga | Menampilkan rentang pasar |
| Harga baterai per kWh | Rupiah | Rp4.500.000 | Hybrid/off-grid |
| Biaya tambahan | Rupiah | 0 | Perkuatan atap, dll. |
| Metode pembayaran | Tunai / Cicilan | Tunai | – |
| Uang muka, bunga, tenor | %, %/th, tahun | 20%, 11%, 5 th | Mode cicilan |
| Asumsi lanjutan (akordeon) | kenaikan tarif, inflasi, diskonto, umur sistem, degradasi, O&M, umur & biaya ganti inverter/baterai, faktor emisi, kompensasi ekspor | lihat §9.12 | Setiap asumsi punya tooltip penjelasan |

| ID | Kebutuhan umum wizard | Kriteria penerimaan |
| --- | --- | --- |
| FR-WZ-01 | Indikator langkah (stepper) yang bisa diklik | Pengguna bisa lompat ke langkah mana pun |
| FR-WZ-02 | Ringkasan live (desktop: panel samping *sticky*; mobile: bar bawah yang bisa dibuka) | Nilai kWp, investasi, hemat/bulan, balik modal diperbarui saat isian berubah |
| FR-WZ-03 | Validasi inline berbahasa Indonesia | Pesan kesalahan jelas, tombol Lanjut tetap aktif bila nilai bisa dikoreksi otomatis |
| FR-WZ-04 | Draft tersimpan otomatis di perangkat | Muat ulang halaman tidak menghilangkan isian |
| FR-WZ-05 | Tombol "Kembalikan ke default" per bagian | – |
| FR-WZ-06 | Input angka memakai keyboard numerik & format Rupiah otomatis (Rp1.500.000) | Berfungsi di iOS & Android |

### 8.3 Dashboard Hasil (FR-RS)

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| FR-RS-01 | **Ringkasan utama**: kalimat rekomendasi ("PLTS On-Grid 3,3 kWp — 6 panel 550 Wp") + kartu KPI: Investasi, Hemat/bulan, Balik modal, ROI 25 th, Porsi energi hijau, CO₂ dihindari/tahun | Terbaca tanpa scroll horizontal di 360 px |
| FR-RS-02 | **Status kelayakan** (Sangat layak / Layak / Kurang layak / Tidak layak) berdasarkan payback & NPV, dengan penjelasan singkat | Konsisten dengan angka |
| FR-RS-03 | **Spesifikasi sistem**: kWp, jumlah & tipe panel, inverter (kW, fase), baterai (kWh, usable), luas atap dibutuhkan, produksi tahunan, *specific yield*, *performance ratio* | – |
| FR-RS-04 | **Tagihan sebelum vs sesudah** (per bulan, tahun pertama) | Memperhitungkan rekening minimum & pajak |
| FR-RS-05 | **Grafik energi bulanan**: produksi vs konsumsi, bagian terpakai sendiri, surplus terbuang | Tooltip nilai per bulan |
| FR-RS-06 | **Grafik profil harian** (24 jam): beban, produksi, dipakai langsung, dari baterai, dari PLN, surplus | Bisa pilih bulan |
| FR-RS-07 | **Grafik arus kas kumulatif** 25 tahun dengan penanda titik balik modal | – |
| FR-RS-08 | **Tabel arus kas tahunan** (produksi, hemat, O&M, penggantian, arus kas, kumulatif) — dapat dilipat | Bisa di-scroll horizontal *di dalam* tabel pada mobile |
| FR-RS-09 | **Metrik finansial**: payback sederhana & terdiskonto, NPV, IRR, ROI, LCOE vs tarif PLN, total hemat 25 th | – |
| FR-RS-10 | **Pilihan kapasitas**: grafik kWp vs payback & NPV, tabel 3–5 opsi (rekomendasi, tercepat balik modal, cakupan maksimal), tombol "Gunakan ukuran ini" | Hitung ulang instan |
| FR-RS-11 | **Perbandingan sistem**: on-grid vs hybrid vs off-grid (investasi, hemat, payback, porsi energi hijau, kelebihan) | – |
| FR-RS-12 | **Cicilan** (jika dipilih): cicilan/bulan vs hemat/bulan, total bunga | – |
| FR-RS-13 | **Sensitivitas**: perubahan payback bila harga ±20%, kenaikan tarif 0%/6%, radiasi ±10%, porsi siang ±10 poin | Grafik tornado |
| FR-RS-14 | **Dampak lingkungan**: CO₂/tahun & 25 th, setara pohon, setara km mobil | – |
| FR-RS-15 | **Asumsi & catatan**: daftar asumsi yang dipakai, sumber data radiasi (badge NASA POWER/estimasi), peringatan (mis. target tidak tercapai, tarif bersubsidi) | – |
| FR-RS-16 | Aksi: Ubah data, Simpan & Bagikan, Salin tautan, Bagikan ke WhatsApp, Cetak/Unduh PDF | – |

### 8.4 Simpan, Bagikan & Cetak (FR-SH)

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| FR-SH-01 | Simpan input ke server, dapatkan ID pendek (10 karakter) & URL `/hasil/{id}` | Respons < 1 detik |
| FR-SH-02 | Halaman `/hasil/{id}` menampilkan hasil lengkap (dihitung ulang dari input tersimpan dengan versi engine tercatat) + tombol "Salin ke kalkulator saya" | Tautan tidak valid → halaman 404 ramah |
| FR-SH-03 | Judul opsional (mis. "Rumah Bekasi") | Maks. 80 karakter |
| FR-SH-04 | Cetak/PDF memakai tata letak A4: header merek, ringkasan, grafik, tabel, asumsi, disclaimer; elemen navigasi disembunyikan | Tidak ada elemen terpotong di Chrome/Safari |
| FR-SH-05 | Riwayat lokal: daftar hasil yang pernah disimpan di perangkat | C |

### 8.5 Konten Edukasi (FR-ED)

- **Panduan** (`/panduan`): apa itu PLTS; on-grid vs hybrid vs off-grid; komponen; aturan PLTS atap (Permen ESDM 2/2024 — kuota, tanpa kompensasi ekspor, pascabayar, SLO); langkah pemasangan (survei → desain → pengajuan kuota PLN → instalasi → uji & SLO → penggantian meter → operasi); tips memilih installer; perawatan; FAQ.
- **Metodologi** (`/metodologi`): rumus, asumsi default, sumber data, batasan model.
- **Glosarium & tooltip**: istilah (kWp, PSH, PR, self-consumption, NPV, IRR, LCOE, DoD) dijelaskan di tempat melalui ikon info.

### 8.6 API (FR-API)

Lihat §12.5. Semua endpoint memvalidasi input dengan skema yang sama dengan frontend dan mengembalikan pesan kesalahan berbahasa Indonesia.

---

## 9. Metodologi Perhitungan

Engine ditulis sebagai modul TypeScript murni (tanpa ketergantungan DOM) sehingga **berjalan identik di peramban (hasil instan) dan server (API & laporan tersimpan)**.

### 9.1 Konsumsi & tarif

- Tarif efektif: `T_eff = T_golongan × (1 + PBJT + PPN)`; PPN efektif 11% hanya untuk rumah tangga ≥ 6.600 VA (R-3).
- Dari tagihan: `kWh_bulan = Tagihan / T_eff`.
- Konsumsi harian bulan *m*: `L_m = kWh_bulan_m / hari_m`. Bila input 12 bulan, tiap bulan memakai nilainya sendiri.
- Rekening minimum pascabayar: `40 jam × daya (kVA) × T_golongan` per bulan. Setelah PLTS terpasang, pelanggan on-grid/hybrid diperlakukan pascabayar (sesuai regulasi), sehingga tagihan sesudah PLTS tidak bisa lebih rendah dari rekening minimum.

### 9.2 Data radiasi matahari

Urutan sumber:
1. **NASA POWER** (klimatologi bulanan GHI `ALLSKY_SFC_SW_DWN` & suhu `T2M`) berdasarkan koordinat, diambil oleh server, di-*cache* di database (kunci koordinat dibulatkan 0,25°), batas waktu 8 detik.
2. **Dataset bawaan** ±110 kota Indonesia: GHI rata-rata tahunan (kWh/m²/hari) + suhu rata-rata + pola musiman regional (faktor 12 bulan: Jawa–Bali, Nusa Tenggara, Sumatra Utara, Sumatra Selatan, Khatulistiwa, Sulawesi Selatan, Sulawesi Utara, Maluku, Papua Selatan). Nilai adalah **estimasi** yang dibulatkan dari rujukan publik (NASA POWER, Global Solar Atlas) dan ditandai jelas di UI.
3. **Manual** — pengguna profesional dapat memasukkan 12 nilai GHI sendiri.

### 9.3 Model produksi PV (per kWp)

Untuk setiap bulan *m* dipakai **hari rata-rata** (Klein, 1977: 17 Jan, 16 Feb, 16 Mar, 15 Apr, 15 Mei, 11 Jun, 17 Jul, 16 Agu, 15 Sep, 15 Okt, 14 Nov, 10 Des), disimulasikan per 10 menit:

1. **Posisi matahari**: deklinasi `δ = 23,45° · sin(360°·(284+n)/365)`; sudut jam `ω = 15°·(t_surya − 12)`; sudut terbenam `ω_s = arccos(−tan φ · tan δ)`; waktu surya dari jam lokal memakai koreksi bujur zona (WIB 105°, WITA 120°, WIT 135°) dan *equation of time* (Spencer).
2. **Radiasi ekstraterestrial harian** `H₀` dan indeks kecerahan `K_T = H/H₀`.
3. **Fraksi difus harian** (Erbs, untuk `ω_s > 81,4°`): `H_d/H = 1,311 − 3,022 K_T + 3,427 K_T² − 1,821 K_T³`.
4. **Distribusi per waktu**: global dengan Collares-Pereira & Rabl, difus dengan Liu & Jordan; dinormalisasi agar total harian tepat `H` dan `H_d`.
5. **Transposisi ke bidang miring** (model isotropik):
   `G_T = G_b · R_b + G_d · (1 + cos β)/2 + G · ρ · (1 − cos β)/2`, albedo `ρ = 0,2`, `R_b = cos θ / cos θ_z` (sudut datang θ untuk kemiringan β dan azimut γ).
6. **Suhu sel**: `T_c = T_a(t) + (NOCT_ef − 20)/800 · G_T`, `T_a` berosilasi harian ±4 °C di sekitar suhu rata-rata bulanan; `NOCT_ef = 48 °C` (pemasangan atap).
7. **Daya DC per kWp**: `P_dc = G_T/1000 · [1 + γ_P (T_c − 25)] · (1 − susut_lain)`, `γ_P = −0,35%/°C`.
8. **Daya AC**: `P_ac = min(P_dc · η_inv, 1/rasio_DC/AC)`, `η_inv = 97,5%`, rasio DC/AC 1,15 (pemotongan/clipping ikut terhitung).
9. Hasil: matriks **12 bulan × 24 jam** (kWh/kWp, jam lokal), produksi bulanan, *specific yield* (kWh/kWp/tahun) dan *performance ratio*.

Susut lain (multiplikatif): kotoran 4%, mismatch 2%, kabel DC 1,5%, kabel AC 0,5%, ketersediaan 1%, bayangan sesuai input. Degradasi: tahun-1 1%, lalu 0,5%/tahun.

### 9.4 Profil beban & simulasi per jam

- Templat profil 24 jam (dinormalisasi): **Rumah — aktif pagi & malam** (±38% siang), **Rumah — banyak aktivitas siang** (±54%), **Kantor/toko/sekolah jam kerja** (±79%), **Toko/restoran siang–malam** (±58%), **Usaha/industri 24 jam** (±54%), **Kustom** (porsi siang 06–18 diatur slider; profil = campuran bentuk siang & bentuk malam).
- Untuk tiap tahun *y* (1…25), bulan *m*, jam *h*:
  - `PV = kWp · pv[m][h] · faktor_degradasi_y`, `Beban = L_m · profil[h]`
  - Tanpa baterai: `Pakai_langsung = min(PV, Beban)`, `Surplus = PV − Pakai_langsung`, `Impor = Beban − Pakai_langsung`.
  - Total bulanan = nilai hari representatif × jumlah hari.
- **Self-consumption rate** = energi PV terpakai / produksi PV. **Porsi energi hijau (solar fraction)** = energi PV terpakai (langsung + via baterai) / total konsumsi.

### 9.5 Baterai (hybrid & off-grid)

- LiFePO4: DoD 90%, efisiensi bolak-balik 92% (√ per arah), batas daya 0,5C, penurunan kapasitas 2%/tahun, umur 10 tahun lalu diganti (harga penggantian −30%).
- Simulasi 2 hari berturut-turut per bulan (hari ke-2 dipakai sebagai kondisi tunak): surplus mengisi baterai, defisit dikosongkan dari baterai, sisanya impor PLN (hybrid) atau **tidak terlayani** (off-grid).
- Ukuran otomatis:
  - *Simpan surplus*: kapasitas usable ≈ min(rata-rata surplus harian, beban malam) → dibulatkan ke modul 5,12 kWh.
  - *Cadangan padam*: `jam × beban_esensial / DoD`.
  - *Off-grid*: PV dipilih agar bulan terburuk tetap mencukupi (+10% margin); baterai = `beban malam × hari otonomi / (DoD · η)`.

### 9.6 Penentuan kapasitas (sizing)

- Kandidat: kelipatan jumlah panel dari 1 hingga `N_max`, dengan `N_max = min(batas luas atap, batas daya tersambung (bila aktif: kWp ≤ kVA × rasio DC/AC), batas produksi ≤ 200% konsumsi)`. Untuk sistem besar, kandidat disampling ±120 titik lalu diperhalus di sekitar titik terbaik.
- **Optimal** (default): pilih kandidat dengan **NPV terbesar** (basis tunai). Jika semua NPV ≤ 0, tetap pilih NPV terbesar dan beri status "belum ekonomis" + penjelasan (misal tarif bersubsidi, pemakaian siang kecil).
- **Target %**: kapasitas terkecil yang mencapai porsi energi hijau target; bila tidak tercapai (mis. on-grid tanpa baterai dengan pemakaian malam dominan), pakai kapasitas yang mencapai 98% dari porsi maksimum dan tampilkan saran (mis. pertimbangkan hybrid).
- **Manual**: kWp dari pengguna dibulatkan ke jumlah panel terdekat.
- Inverter: `kW_AC = kWp / 1,15` dibulatkan ke ukuran standar (1,5; 2; 3; 3,6; 4; 5; 6; 8; 10; 12; 15; 17; 20; 25; 30; 36; 40; 50; 60; 75; 100; 110; 125 kW; di atasnya kombinasi 110 kW). ≤ 6 kW → 1 fase, di atasnya 3 fase.
- Luas atap: `N_panel × luas_panel × faktor_ruang (1,2)`.

### 9.7 Biaya investasi (CAPEX)

- Harga sistem on-grid terpasang (turnkey) per kWp mengikuti kurva interpolasi log-linear (kelas Standar, 2026):

  | Kapasitas | 1 kWp | 2 | 3 | 5 | 10 | 20 | 50 | 100 | 250 | 500 | ≥1.000 |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Rp juta/kWp | 17,0 | 15,5 | 14,5 | 13,5 | 12,5 | 11,5 | 10,5 | 9,75 | 9,0 | 8,5 | 8,0 |

- Pengali kelas: Ekonomis 0,85 · Standar 1,00 · Premium 1,20. Premi inverter hybrid +Rp2 juta/kWp; off-grid +Rp2,5 juta/kWp.
- Baterai: kWh nominal × harga/kWh (default Rp4,5 juta/kWh terpasang).
- Rincian estimasi (untuk ditampilkan): panel 38%, inverter 17%, struktur 10%, kabel & proteksi 12%, jasa instalasi & komisioning 15%, desain/perizinan/administrasi 8%.
- Pengguna dapat mengganti harga/kWp dengan penawaran nyata dari installer.

### 9.8 Analisis finansial

Untuk tahun *y* = 1…*N* (default 25):

- `Tarif_y = T_eff · (1 + e)^(y−1)` (e = kenaikan tarif, default 3%/tahun)
- `Hemat_y = Σ_bulan [Tagihan_sebelum − Tagihan_sesudah]` dengan `Tagihan_sesudah = max(Impor, Rek_min) · Tarif_y` (+ kompensasi ekspor bila skenario diaktifkan; default 0% sesuai Permen ESDM 2/2024)
- `O&M_y = 1% · CAPEX · (1 + inflasi)^(y−1)`
- `Ganti_y` = penggantian inverter (tahun 12; 10% CAPEX PV) & baterai (sesuai umur; 70% harga awal baterai)
- `AK_y = Hemat_y − O&M_y − Ganti_y`, `AK_0 = −CAPEX`

Metrik:
- **Payback sederhana**: tahun ketika kumulatif `AK` ≥ 0 (interpolasi linier dalam tahun → "X tahun Y bulan").
- **Payback terdiskonto**: sama, dengan `AK_y/(1+r)^y` (r default 6%).
- **NPV** = `Σ AK_y/(1+r)^y − CAPEX`; **IRR** = r yang membuat NPV = 0 (bisection).
- **ROI** = `(Σ AK_y − CAPEX) / CAPEX`.
- **LCOE** = `(CAPEX + Σ (O&M_y + Ganti_y)/(1+r)^y) / Σ (Produksi_y/(1+r)^y)` → dibandingkan dengan tarif PLN.
- **Status kelayakan**: Sangat layak (payback ≤ 7 th & NPV > 0), Layak (≤ 10 th & NPV > 0), Kurang layak (NPV > 0 tapi payback > 10 th), Tidak layak (NPV ≤ 0 atau tidak balik modal dalam umur sistem).

### 9.9 Pembiayaan (cicilan)

- Pokok = `CAPEX × (1 − DP)`; cicilan anuitas `A = P · i / (1 − (1+i)^−n)` dengan `i` = bunga/12, `n` = tenor × 12.
- Ditampilkan: cicilan/bulan vs hemat/bulan tahun-1, selisih, total bunga, dan arus kas dengan pembiayaan (AK₀ = −DP; tahun 1…tenor dikurangi 12 × cicilan).
- Metrik utama (payback, NPV, IRR) tetap disajikan **basis proyek (tunai)** agar sebanding; metrik dengan pembiayaan ditampilkan terpisah.

### 9.10 Dampak lingkungan

- CO₂ dihindari = energi PV terpakai × faktor emisi grid (default **0,84 kg CO₂/kWh**, faktor emisi sistem Jawa–Madura–Bali, ESDM; dapat diubah).
- Setara pohon = CO₂ / 22 kg per pohon per tahun; setara km mobil = CO₂ / 0,15 kg per km.
- Off-grid dengan pembanding genset: faktor emisi diesel 0,8 kg CO₂/kWh.

### 9.11 Analisis sensitivitas

Hitung ulang payback & NPV dengan satu variabel diubah (lainnya tetap): CAPEX ±20%, kenaikan tarif 0% & 6%, radiasi ±10%, porsi pemakaian siang ±10 poin. Disajikan sebagai grafik tornado.

### 9.12 Tabel asumsi default

| Parameter | Default | Rentang yang diizinkan |
| --- | --- | --- |
| Kenaikan tarif PLN | 3%/tahun | 0–15% |
| Inflasi biaya O&M | 3%/tahun | 0–15% |
| Tingkat diskonto | 6%/tahun | 0–25% |
| Umur sistem | 25 tahun | 10–30 |
| Degradasi tahun pertama / tahunan | 1% / 0,5% | 0–5% / 0–2% |
| O&M | 1% CAPEX/tahun | 0–5% |
| Umur inverter / biaya ganti | 12 tahun / 10% CAPEX PV | 5–20 th / 0–40% |
| Baterai: DoD / efisiensi / umur / harga | 90% / 92% / 10 th / Rp4,5 jt per kWh | – |
| Efisiensi inverter | 97,5% | 90–99% |
| Koefisien suhu / NOCT efektif | −0,35%/°C / 48 °C | – |
| Susut lain (kotoran, mismatch, kabel, ketersediaan) | ±8,7% total | – |
| Panel | 550 Wp, 2,58 m²/panel, faktor ruang 1,2 | 450–700 Wp |
| PBJT / PPN (R-3) | 3% / 11% | 0–10% / 0–12% |
| Kompensasi ekspor | 0% (Permen ESDM 2/2024) | 0–100% (skenario) |
| Faktor emisi grid | 0,84 kg CO₂/kWh | 0,3–1,2 |
| Biaya listrik genset | Rp6.000/kWh | – |

### 9.13 Validasi & batasan model

- Uji unit memastikan: keseimbangan energi (PV = pakai langsung + ke baterai + surplus), total distribusi radiasi = GHI harian, PR berada di rentang 0,70–0,85 untuk seluruh kota, specific yield wajar (1.150–1.700 kWh/kWp/th), NPV/IRR sesuai perhitungan acuan.
- Batasan: hari representatif (bukan 8760 jam) sehingga variasi hari mendung berturut-turut hanya didekati lewat hari otonomi; bayangan hanya sebagai persentase; harga pasar bervariasi ±20%.

---

## 10. Data Referensi & Sumber

### 10.1 Tarif tenaga listrik PLN (berlaku triwulan III 2026, ditetapkan tetap)

| Golongan | Batas daya | Rp/kWh |
| --- | --- | --- |
| R-1/TR (subsidi) | 450 VA | 415,00 |
| R-1/TR (subsidi) | 900 VA | 605,00 |
| R-1/TR (RTM) | 900 VA | 1.352,00 |
| R-1/TR | 1.300 VA | 1.444,70 |
| R-1/TR | 2.200 VA | 1.444,70 |
| R-2/TR | 3.500–5.500 VA | 1.699,53 |
| R-3/TR | ≥ 6.600 VA | 1.699,53 |
| B-2/TR | 6.600 VA–200 kVA | 1.444,70 |
| B-3/TM, TT | > 200 kVA | 1.114,74 (LWBP) |
| I-3/TM | > 200 kVA | 1.114,74 (LWBP) |
| I-4/TT | ≥ 30.000 kVA | 996,74 |
| P-1/TR | 6.600 VA–200 kVA | 1.699,53 |
| P-2/TM | > 200 kVA | 1.522,88 (LWBP) |
| P-3/TR | – | 1.699,53 |
| L/TR, TM, TT | – | 1.644,52 |

Catatan: untuk golongan TM/TT, produksi PLTS terjadi pada jam LWBP sehingga penghematan dihitung dengan tarif LWBP. Tabel tarif disimpan sebagai data berversi (`lastUpdated`) dan mudah diperbarui.

### 10.2 Regulasi
- Permen ESDM No. 2 Tahun 2024 tentang PLTS Atap yang Terhubung pada Jaringan Tenaga Listrik Pemegang IUPTLU.
- UU No. 1 Tahun 2022 (HKPD) & PP No. 4 Tahun 2023: PBJT tenaga listrik maksimal 10%.

### 10.3 Harga pasar (kisaran publik 2025–2026)
- PLTS atap on-grid rumah tangga: ±Rp11–19 juta/kWp (paket 2–5 kWp); komersial/industri: ±Rp10–13 juta/kWp.
- Baterai LiFePO4 48 V 100 Ah (±5 kWh): ±Rp12–20 juta.

### 10.4 Lingkungan
- Faktor emisi sistem Jawa–Madura–Bali 0,844 tCO₂/MWh (metodologi reduksi emisi, Ditjen Ketenagalistrikan ESDM).

---

## 11. Desain UX/UI

### 11.1 Prinsip desain
1. **Jawaban dulu, detail kemudian** — angka terpenting tampil paling atas; detail dalam tab/akordeon.
2. **Default cerdas** — pengguna bisa menyelesaikan kalkulator tanpa mengubah apa pun selain tagihan & kota.
3. **Transparan** — setiap angka punya penjelasan (tooltip/metodologi); tidak ada "kotak hitam".
4. **Jujur** — bila PLTS tidak ekonomis (mis. tarif subsidi), aplikasi mengatakannya dengan jelas.
5. **Mobile-first** — didesain untuk layar 360 px lalu diperluas ke desktop.

### 11.2 Identitas visual

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| `primary` | Emerald 600 `#059669` | Tombol utama, tautan, elemen aktif |
| `primary-dark` | Emerald 700 `#047857` | Hover/pressed |
| `forest` | `#064E3B` | Judul, header hero, footer |
| `mint` | `#ECFDF5` | Latar seksi, kartu sekunder |
| `leaf` | Lime 500 `#84CC16` | Aksen energi hijau, badge |
| `sun` | Amber 500 `#F59E0B` | Produksi surya, ikon matahari |
| `sky` | Sky 500 `#0EA5E9` | Listrik dari PLN |
| `ink` | Slate 900 `#0F172A` | Teks utama |
| `muted` | Slate 500 `#64748B` | Teks sekunder |
| `danger` / `warning` | Rose 600 / Amber 600 | Peringatan & kesalahan |

- **Tipografi**: *Plus Jakarta Sans* (dirancang di Indonesia) untuk judul & isi; angka memakai *tabular numbers*.
- **Bentuk**: sudut membulat 12–20 px, bayangan lembut, gradien hijau–teal pada hero, motif daun & matahari.
- **Ikon**: Lucide (Sun, Leaf, Zap, Battery, Home, Wallet, TrendingUp).
- **Gerak**: transisi halus 150–250 ms; menghormati `prefers-reduced-motion`.

### 11.3 Semantik warna grafik (konsisten di semua grafik)

| Seri | Warna |
| --- | --- |
| Produksi PV | Amber (matahari) |
| Dipakai langsung dari PV | Hijau emerald |
| Dari/ke baterai | Violet |
| Impor dari PLN | Biru langit |
| Surplus terbuang/diekspor | Oranye muda |
| Konsumsi/beban | Garis slate gelap |

### 11.4 Layout responsif

| Breakpoint | Lebar | Tata letak |
| --- | --- | --- |
| Mobile | < 640 px | 1 kolom, KPI 2 kolom, bar ringkasan bawah *sticky*, tombol navigasi langkah di bawah |
| Tablet | 640–1023 px | 2 kolom kartu, grafik lebar penuh |
| Desktop | ≥ 1024 px | Wizard 2 kolom (form + ringkasan *sticky*), dashboard grid 12 kolom |

Target sentuh ≥ 44 px, tidak ada scroll horizontal pada halaman (tabel lebar di-scroll di dalam kontainernya).

### 11.5 Wireframe

**Mobile — Wizard (langkah 2)**
```
┌──────────────────────────────┐
│ ☀ SuryaHitung          ☰     │
├──────────────────────────────┤
│ ● Lokasi ─ ● Listrik ─ ○ ─ ○ │
│ Langkah 2 dari 4             │
│ Pemakaian Listrik            │
│ ┌──────────────────────────┐ │
│ │ Golongan & daya       ▾  │ │
│ └──────────────────────────┘ │
│ [ Tagihan | kWh | 12 bulan ] │
│ ┌──────────────────────────┐ │
│ │ Rp 1.000.000             │ │
│ └──────────────────────────┘ │
│ Pola pemakaian               │
│ ┌──────────┐ ┌──────────┐    │
│ │ ▁▂▁▁▃▇▅  │ │ ▃▅▇▇▅▃▂  │    │
│ │ Pagi &   │ │ Banyak   │    │
│ │ malam ✓  │ │ siang    │    │
│ └──────────┘ └──────────┘    │
├──────────────────────────────┤
│ 3,3 kWp · Balik modal 7,1 th ▴│
│ [ Kembali ]      [ Lanjut → ]│
└──────────────────────────────┘
```

**Desktop — Dashboard hasil**
```
┌───────────────────────────────────────────────────────────────┐
│ ☀ SuryaHitung    Kalkulator  Panduan  Metodologi   [Hitung]   │
├───────────────────────────────────────────────────────────────┤
│ Rekomendasi: PLTS On-Grid 3,3 kWp (6 × 550 Wp)   ● Layak      │
│ ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐  │
│ │Investasi││Hemat/bln││Balik   ││ROI 25th││Energi  ││CO₂/th  │  │
│ │Rp 47 jt ││Rp 520rb ││7,1 th  ││ 212%   ││hijau 36%││3,1 ton │  │
│ └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘  │
│ [Ringkasan] [Energi] [Keuangan] [Pilihan Ukuran] [Bandingkan] │
│ ┌──────────────────────────────┐ ┌──────────────────────────┐ │
│ │ Arus kas kumulatif (25 th)   │ │ Spesifikasi sistem       │ │
│ │        ___/‾‾‾               │ │ Panel 6 × 550 Wp         │ │
│ │ ──────/────── 0              │ │ Inverter 3 kW 1 fase     │ │
│ │  ___/   ▲ balik modal        │ │ Luas atap ±19 m²         │ │
│ └──────────────────────────────┘ └──────────────────────────┘ │
│ [Simpan & Bagikan] [Unduh PDF] [Ubah Data]                    │
└───────────────────────────────────────────────────────────────┘
```

### 11.6 Tone & microcopy
- Bahasa Indonesia yang ramah, lugas, tanpa jargon; istilah teknis selalu disertai penjelasan.
- Contoh: "Balik modal dalam **7 tahun 1 bulan** — setelah itu listrik dari atap Anda praktis gratis hingga tahun ke-25."
- Pesan kesalahan menyarankan solusi: "Tagihan minimal Rp50.000. Coba masukkan tagihan rata-rata 3 bulan terakhir."

### 11.7 Aksesibilitas
- Kontras teks ≥ 4,5:1; fokus terlihat; semua kontrol dapat dioperasikan keyboard; label ARIA untuk grafik (ringkasan teks alternatif); ukuran teks dapat diperbesar hingga 200% tanpa rusak.

---

## 12. Arsitektur Teknis

### 12.1 Stack

| Lapisan | Teknologi | Alasan |
| --- | --- | --- |
| Framework full stack | **Next.js 16 (App Router)** + React 19 | SSR/SSG untuk SEO, route handler untuk API, satu repositori |
| Bahasa | TypeScript 5.9 (strict) | Keamanan tipe engine & API |
| Styling | Tailwind CSS 4 + komponen internal (Radix UI untuk primitif aksesibel) | Cepat, konsisten, ringan |
| Grafik | Recharts 3 | Responsif, deklaratif |
| Validasi | Zod 4 (skema dibagi frontend & API) | Satu sumber kebenaran |
| State | Zustand (+ persist localStorage) | Ringan untuk wizard |
| Database | **SQLite/libSQL via Drizzle ORM** (`file:` lokal; Turso untuk serverless) | Tanpa server DB terpisah, mudah di-deploy |
| Data eksternal | NASA POWER API (server-side, cache DB) | Radiasi berbasis koordinat |
| Uji | Vitest (unit/API), Playwright (E2E & visual) | – |
| Font | Plus Jakarta Sans (self-hosted via Fontsource) | Tidak bergantung CDN saat build |

### 12.2 Diagram arsitektur

```
┌──────────────────────── Peramban ─────────────────────────┐
│  Next.js (React)  ── UI wizard, dashboard, grafik          │
│        │                                                   │
│        ├── Engine PLTS (TypeScript murni) ◄─ hasil instan  │
│        └── fetch ──────────────┐                           │
└────────────────────────────────┼───────────────────────────┘
                                 ▼
┌──────────────────── Server Next.js (Node) ────────────────┐
│  Route Handlers /api/*                                    │
│   ├─ /calculate  → validasi Zod → Engine PLTS             │
│   ├─ /irradiance → cache DB → NASA POWER → fallback kota  │
│   ├─ /reports    → simpan/ambil laporan                   │
│   ├─ /locations, /tariffs, /health                        │
│  Server Components: /hasil/[id] (SSR + metadata)          │
│        │                                                  │
│        ▼                                                  │
│  Drizzle ORM ──► libSQL (SQLite file / Turso)             │
└───────────────────────────────────────────────────────────┘
```

### 12.3 Struktur folder

```
src/
  app/                    # halaman & route handler
    page.tsx              # landing
    kalkulator/           # wizard + hasil
    hasil/[id]/           # laporan tersimpan (SSR)
    panduan/, metodologi/
    api/                  # calculate, irradiance, locations, tariffs, reports, health
  components/
    ui/                   # komponen dasar (button, card, input, slider, tabs, ...)
    layout/, landing/, calculator/, results/
  lib/
    engine/               # engine PLTS murni + tipe
    data/                 # tarif, lokasi, harga, profil beban, panel
    db/                   # skema & klien Drizzle
    server/               # layanan server (irradiance, reports, rate limit)
    schema.ts             # skema input Zod
    format.ts             # format Rupiah/angka/durasi (id-ID)
  store/                  # state wizard (Zustand)
tests/                    # uji unit engine & API
e2e/                      # uji Playwright
drizzle/                  # migrasi SQL
docs/PRD.md
```

### 12.4 Model data

**Tabel `reports`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | text PK | ID pendek acak (10 karakter, URL-safe) |
| `title` | text null | Judul opsional |
| `engine_version` | text | Versi engine saat disimpan |
| `input_json` | text (JSON) | Input lengkap (tervalidasi) |
| `summary_json` | text (JSON) | Ringkasan hasil (kWp, CAPEX, payback, hemat, CO₂) untuk metadata/OG |
| `location_name` | text | Untuk tampilan/daftar |
| `system_type` | text | on-grid / hybrid / off-grid |
| `view_count` | integer | Jumlah dibuka |
| `created_at` / `updated_at` | integer (epoch ms) | – |

**Tabel `irradiance_cache`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `key` | text PK | `lat,lon` dibulatkan 0,25° |
| `lat`, `lon` | real | – |
| `source` | text | `nasa-power` |
| `ghi_json` | text | 12 nilai kWh/m²/hari |
| `temp_json` | text | 12 nilai °C |
| `fetched_at` | integer | Kedaluwarsa 180 hari |

### 12.5 Spesifikasi API

| Metode & path | Deskripsi | Request | Response |
| --- | --- | --- | --- |
| `POST /api/calculate` | Hitung lengkap | `CalculatorInput` (JSON) | `CalculationResult` (200) / 400 + `issues` |
| `GET /api/irradiance?lat=&lon=` | Radiasi bulanan | query | `{ source, lat, lon, ghi[12], temp[12], fetchedAt }` |
| `GET /api/locations?q=` | Cari kota | query | `{ items: Location[] }` |
| `GET /api/tariffs` | Tabel tarif PLN | – | `{ lastUpdated, items: Tariff[] }` |
| `POST /api/reports` | Simpan laporan | `{ title?, input }` | `{ id, url }` (201) |
| `GET /api/reports/{id}` | Ambil laporan | – | `{ id, title, input, summary, createdAt }` / 404 |
| `GET /api/health` | Status layanan | – | `{ status, db, version }` |

Kesalahan memakai format `{ error: { code, message, issues? } }` dengan pesan berbahasa Indonesia.

### 12.6 Keamanan & privasi
- Validasi ketat semua input (Zod), batas ukuran body (64 KB), *rate limit* per IP (simpan laporan 30/jam, hitung 120/menit).
- Tidak meminta data pribadi; laporan hanya berisi parameter perhitungan & judul opsional.
- Header keamanan: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` (geolokasi hanya untuk origin sendiri).
- Kueri DB terparameterisasi (Drizzle); tidak ada HTML dari pengguna yang dirender tanpa escape.

### 12.7 Konfigurasi & deployment
- Variabel lingkungan: `DATABASE_URL` (default `file:./data/suryahitung.db`), `DATABASE_AUTH_TOKEN` (Turso), `NEXT_PUBLIC_SITE_URL`, `NASA_POWER_ENABLED` (default `true`).
- Migrasi dijalankan otomatis saat server pertama kali mengakses DB (idempoten) dan tersedia skrip `npm run db:migrate`.
- Target deploy: Vercel (+Turso) atau Node/Docker di VPS (SQLite file dengan volume persisten).

---

## 13. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
| --- | --- |
| Performa | LCP ≤ 2,5 s (4G), JS awal halaman landing ≤ 200 KB gzip, perhitungan ≤ 100 ms |
| Ketersediaan | Kalkulator tetap berfungsi jika DB/NASA tidak tersedia (fallback dataset; simpan dinonaktifkan dengan pesan) |
| Kompatibilitas | Chrome/Edge/Firefox/Safari 2 versi terakhir, Android 9+, iOS 15+ |
| Responsif | 360–1920 px tanpa scroll horizontal halaman |
| Aksesibilitas | WCAG 2.1 AA |
| SEO | Metadata per halaman, Open Graph, sitemap, robots, data terstruktur `WebApplication` |
| Lokalisasi | id-ID (format Rp1.234.567, desimal koma); struktur siap i18n |
| Maintainability | Engine & data referensi terpisah, berversi, cakupan uji engine tinggi; lint & typecheck wajib lulus |
| Observabilitas | Log server terstruktur untuk error API & kegagalan NASA |

---

## 14. Analitik & Metrik Keberhasilan

Event (Fase 2, privasi-first tanpa data pribadi): `calc_started`, `step_completed{step}`, `result_viewed{systemType, kwp_bucket}`, `size_option_applied`, `report_saved`, `report_shared{channel}`, `pdf_printed`, `guide_viewed`.

KPI: rasio penyelesaian, waktu ke hasil, rasio simpan/bagikan, rasio cetak, pengunjung kembali, distribusi jenis sistem.

---

## 15. Strategi Pengujian

| Level | Cakupan |
| --- | --- |
| Unit (Vitest) | Model surya (distribusi, transposisi, suhu), profil beban, simulasi & baterai (keseimbangan energi), sizing, finansial (NPV/IRR/payback/anuitas), format angka, skema input |
| API (Vitest) | `/api/calculate` valid & tidak valid, `/api/reports` simpan-ambil, `/api/irradiance` fallback saat NASA gagal |
| E2E (Playwright) | Hitung cepat di landing, alur wizard lengkap, simpan & buka tautan, tampilan mobile (390 px) & desktop (1440 px) |
| Manual | Uji cetak PDF di Chrome & Safari, uji perangkat Android/iOS |

Kriteria rilis: lint, typecheck, seluruh uji lulus; build produksi sukses; tidak ada error konsol pada alur utama.

---

## 16. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Data radiasi bawaan kurang presisi | Estimasi produksi meleset | Label "estimasi", NASA POWER berbasis koordinat, input manual, rentang ±10% di sensitivitas |
| Harga pasar berubah cepat | Investasi tidak akurat | Harga bisa diubah pengguna, kelas komponen, data berversi |
| Regulasi berubah (kuota, kompensasi ekspor) | Hasil tidak relevan | Parameter kompensasi ekspor & batas daya dapat diatur; konten panduan diperbarui |
| Pengguna menganggap hasil sebagai penawaran resmi | Ekspektasi keliru | Disclaimer jelas, anjuran survei installer |
| API NASA lambat/tidak tersedia | UX terganggu | Timeout 8 s, cache 180 hari, fallback dataset instan |
| DB tidak tersedia di hosting serverless | Fitur simpan gagal | Dukungan Turso; UI menangani kegagalan dengan baik |

---

## 17. Rencana Rilis & Milestone

| Milestone | Isi | Status |
| --- | --- | --- |
| M0 | PRD (dokumen ini) | ✅ |
| M1 | Fondasi proyek, data referensi, engine + uji | MVP |
| M2 | Backend: DB, API, cache NASA POWER | MVP |
| M3 | UI: landing, wizard, dashboard hasil, simpan/bagikan, cetak | MVP |
| M4 | Konten panduan & metodologi, SEO, QA mobile/desktop | MVP |
| M5 | Fase 2: leads & admin, peta, analitik, mode gelap, bahasa Inggris | Berikutnya |
| M6 | Fase 3: modul energi hijau lain | Berikutnya |

---

## 18. Pertanyaan Terbuka

1. Nama produk & domain final (sementara "SuryaHitung"; dapat diganti lewat satu file konfigurasi).
2. Model bisnis: murni edukasi, *lead generation* untuk installer mitra, atau layanan B2B untuk installer?
3. Apakah perlu kerja sama data harga dengan installer/asosiasi (mis. AESI) untuk pembaruan berkala?
4. Kebijakan retensi laporan tersimpan (mis. dihapus otomatis setelah 2 tahun tidak dibuka)?
5. Apakah informasi kuota PLTS atap per UP3 akan ditampilkan (bergantung ketersediaan data publik)?

---

## 19. Disclaimer

Hasil SuryaHitung adalah **estimasi** berbasis model dan asumsi umum, bukan penawaran harga maupun jaminan kinerja. Produksi aktual dipengaruhi cuaca, bayangan, kualitas instalasi, dan perawatan. Keputusan investasi sebaiknya didukung survei lokasi dan penawaran resmi dari installer bersertifikat, serta mengikuti ketentuan PLN dan regulasi yang berlaku.

---

## 20. Lampiran: Glosarium

| Istilah | Arti |
| --- | --- |
| **PLTS** | Pembangkit Listrik Tenaga Surya |
| **kWp** | Kilowatt-peak, kapasitas panel pada kondisi uji standar (1.000 W/m², 25 °C) |
| **GHI / PSH** | Radiasi global horizontal harian (kWh/m²/hari) ≈ jam matahari puncak |
| **On-grid** | Terhubung PLN tanpa baterai; surplus tidak dikompensasi (Permen 2/2024) |
| **Hybrid** | Terhubung PLN + baterai; surplus siang disimpan untuk malam/cadangan padam |
| **Off-grid** | Mandiri tanpa PLN, wajib baterai |
| **Self-consumption** | Porsi produksi PV yang dipakai sendiri |
| **Porsi energi hijau** | Porsi kebutuhan listrik yang dipenuhi PLTS |
| **PR** | Performance ratio, rasio energi aktual terhadap energi teoretis |
| **Specific yield** | Produksi tahunan per kWp (kWh/kWp/tahun) |
| **Payback** | Waktu hingga akumulasi penghematan menutup investasi |
| **NPV** | Nilai kini bersih arus kas pada tingkat diskonto tertentu |
| **IRR** | Tingkat pengembalian internal (diskonto yang membuat NPV = 0) |
| **LCOE** | Biaya listrik rata-rata sepanjang umur sistem (Rp/kWh) |
| **DoD** | Depth of discharge, porsi kapasitas baterai yang boleh dipakai |
| **LWBP/WBP** | Luar Waktu Beban Puncak / Waktu Beban Puncak (tarif TM/TT) |
| **SLO** | Sertifikat Laik Operasi |
| **PBJT** | Pajak Barang dan Jasa Tertentu atas tenaga listrik (dulu PPJ) |
