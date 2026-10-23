# TERANG-KOP · prototipe

Sistem pembukuan Koperasi Desa/Kelurahan Merah Putih yang bisa dilihat pemiliknya, dengan peringatan dini. Prototipe sesuai `PRD TERANG-KOP.docx`: aplikasi web satu berkas, JavaScript tanpa kerangka kerja, data simulasi di localStorage. Semua data fiktif.

## Menjalankan

Buka langsung `dist/terang-kop.html` di peramban (bisa luring).

Atau untuk pengembangan:

```bash
node serve.mjs
```

lalu buka http://localhost:5173.

## Terbitkan di Render

Repo ini berisi `render.yaml`. Di dasbor Render pilih **New > Blueprint**, hubungkan repo `YusufArrayyan/TERANG-KOP`, lalu terapkan. Render menjalankan `node build.mjs` dan menerbitkan folder `dist/` sebagai situs statis; alamat utama membuka halaman depan.

## Membangun ulang berkas tunggal

Halaman depan dibuat dengan React 19, Tailwind CSS 4, Motion, dan Three.js di folder `landing/`. Hasil build-nya (`src/landing/landing.js` dan `landing.css`) ikut disimpan di repo, jadi aplikasi bisa langsung dibuka tanpa memasang apa pun. Setelah mengubah `landing/src`, bangun ulang:

```bash
cd landing && npm install && npm run build
```

Lalu satukan semuanya menjadi satu berkas:

```bash
node build.mjs
```

## Pengujian

```bash
node tests/engine-check.cjs
```

Memeriksa mesin aturan dan angka skenario (September 78 Waspada dengan likuiditas dan kualitas aset kuning, pratinjau Oktober 70, setelah penagihan 94).

```bash
node tests/ui-smoke.mjs
```

Menjalankan halaman depan, semua layar, dan skenario demo di desktop dan ponsel (terang dan gelap) dengan Playwright: pemulihan, RAT, hitung ulang dinas, penarikan dan beban besar, keutuhan, Pengingat tanggal 10, pengaman saldo kas, dan ekspor. Memeriksa galat konsol dan luapan horizontal.

## Struktur

| Berkas | Isi |
|---|---|
| `src/js/engine.js` | Mesin murni: jurnal T01–T13, rantai hash SHA-256, pinjaman, skor PEARLS adaptasi, tutup buku, tiket, e-RAT |
| `src/js/seed.js` | Kopdes Sukamaju (21 anggota, sembilan bulan buku, dibangun lewat mesin yang sama) dan 29 koperasi simulasi |
| `src/js/core.js` | Penyimpanan, sesi, router, kerangka, komponen |
| `src/js/views-*.js` | Layar per peran: Anggota, Pengurus/Pengawas, Pendamping/Dinas, dan layar bersama |
| `landing/src/` | Halaman depan publik (React + Tailwind + Motion + Three.js): grafik 3D riwayat skor, skor yang bisa dioperasikan, cara kerja, lembar keluaran, peta penugasan pemuda KJDP. Semua angka dihitung oleh `src/js/engine.js` |
| `src/js/landing-mount.js` | Menghubungkan rute `#/` ke halaman depan React |
| `src/js/demo.js` | Panel demo dan pemuatan awal |
| `src/css/app.css` | Token desain dan komponen (lihat `DESIGN.md`) |
| `brand/` | Logo TERANG-KOP: SVG hijau dan putih, PNG transparan 1024 px, ikon berlatar putih 512 px, dan PNG asli |
| `public/panduan/` | Video demo, PDF panduan, dan mockup ponsel. Disalin ke `dist/panduan/` saat build dan ditampilkan di bagian "Cara pakai" halaman depan |
| `src/img/` | Empat foto berlisensi CC untuk halaman depan, disisipkan ke berkas tunggal saat build |

## Alur demo

Halaman depan (`#/`) menceritakan alur esai COOPFEST 2026 dan memuat potongan aplikasi yang hidup. Tombol **Coba prototipe** membuka layar masuk; di dalam aplikasi, tombol **Panel demo** menjalankan skenario konsep v1.0:

1. Anggota (Siti Aminah) melihat status Waspada September: likuiditas kuning setelah pelunasan dipercepat utang bank, dan pinjaman menunggak.
2. Pengurus mencatat angsuran PJ-04 dan PJ-06 secara luring lalu sinkron; pratinjau Oktober naik dari 70 (Perlu tindakan) ke 94 (Sehat).
3. Tutup buku Oktober, pengawas mengesahkan; tiket Pendampingan September ditutup pendamping KJDP.
4. Paket RAT terbit dan terkunci, anggota membaca, hadir dengan kode, dan memberi suara; berita acara terbentuk.
5. Dinas melihat 30 koperasi, papan KPI, hitung ulang Sukamaju (hasil sama), dan mengunduh CSV/JSON dari layar Ekspor.
6. Penarikan sukarela Rp1,5 juta dan beban Rp12 juta, lalu tutup buku: Perlu tindakan, tiket Tindak lanjut 14 hari.

Tambahan: memajukan tanggal simulasi melewati tanggal 8 tanpa laporan terbit membuat tiket Pengingat (tenggat tanggal 10); pengeluaran yang melebihi saldo kas atau bank ditolak, dan saat luring berstatus Perlu ditinjau.

## Kredit foto

- "Tugu Koperasi Indonesia (1)" oleh Mirani Pramitasari, CC BY-SA 4.0, via Wikimedia Commons
- "Warung Biru - Desa Ngawonggo" oleh Hngdery, CC BY-SA 4.0, via Wikimedia Commons
- "Village Meeting Hall of Pandansari" oleh ShinyFiver, CC BY-SA 4.0, via Wikimedia Commons
- "Bms rice planting 141229-47913 rwg" oleh Wie146, CC BY-SA 3.0, via Wikimedia Commons

Foto diperkecil dan dikompresi; tidak ada perubahan lain.
