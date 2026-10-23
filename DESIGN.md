# Design

Turunan struktur sistem desain Wise (Inter, tombol pil, kartu radius 24 px, kontras permukaan sebagai elevasi), dengan warna dari logo TERANG-KOP. Semua warna lewat token OKLCH di `src/css/app.css`; tema terang, gelap, dan ikut sistem.

## Warna

| Token | Terang | Pemakaian |
|---|---|---|
| `--brand` | oklch(0.49 0.085 172), hijau logo #1a7060 | Tombol utama, navigasi aktif, cincin skor bawaan |
| `--amber` | oklch(0.80 0.155 78), kuning logo #f5ad1e | Aksen pertumbuhan di logo; pita prototipe (versi pucat) |
| `--canvas` | oklch(0.965 0.008 172) | Latar halaman, netral bernada hijau |
| `--surface` / `--surface-2` | putih / oklch(0.935 0.012 172) | Kartu / kartu sekunder, tombol sekunder |
| `--ink` / `--body` / `--mute` | 0.21 / 0.36 / 0.47 L | Teks utama / isi / keterangan (≥ 4,5:1 di kanvas) |

Status tidak pernah hanya warna; selalu ikon dan kata:

| Status | Token | Ikon |
|---|---|---|
| Sehat | `--ok-*` | lingkaran centang |
| Waspada | `--warn-*` | segitiga |
| Perlu tindakan | `--bad-*` | segi delapan |
| Dikalibrasi | `--cal-*` | pengukur; batang riwayat bergaris |

## Tipografi

Inter 400, 500, 600, 700, 800. Teks isi 16 px. Judul halaman 30 px/800, angka besar 36 px/800 dengan `tabular-nums`. Satu keluarga huruf untuk semua peran.

## Bentuk dan ruang

Tombol pil tinggi 48 px (44 px untuk kecil). Kartu radius 24 px, isi 24 px (20 px di ponsel). Input radius 12 px, tinggi 48 px. Skala ruang 4/8/12/16/24/32/48.

## Tata letak

Lebar ≥ 768 px: bilah samping 264 px. Ponsel: tab bawah (maksimal empat tab plus Lainnya). Tabel lebar dibungkus `.table-wrap` atau ditumpuk dengan `.stackable`.

## Gerak

160 sampai 240 ms dengan ease-out; hanya untuk perubahan status, dialog, dan toast. Semua animasi dimatikan di `prefers-reduced-motion`.

## Halaman depan publik

Register brand, arah "produk yang tampil": potongan antarmuka sungguhan (atribut `data-ui`) yang dihitung oleh mesin yang sama menggantikan ilustrasi. Hero dua bidang hijau tua (`--lp-deep`, `--lp-deep-2`) dengan satu aksi amber. Di luar potongan: tanpa garis tipis, tanpa bayangan diam, permukaan dipisah oleh langkah nada. Halaman depan selalu bertema terang. Gerak: judul naik per baris, bagian masuk bertahap hanya bila belum terlihat, foto pembuka bergeser pelan; semua dimatikan di `prefers-reduced-motion`. Tanpa video agar berkas tunggal tetap di bawah 1 MB.

## Token (Oktober 2026)

Semua nilai lewat token di `:root` pada `src/css/app.css`; tidak ada gaya inline statis di JS (sisanya hanya lebar bar yang dihitung).

| Kelompok | Token |
|---|---|
| Ukuran huruf | `--fs-xs` 13, `--fs-sm` 15, `--fs-base` 16, `--fs-md` 20, `--fs-lg` 28, `--fs-xl` 36 px; halaman depan menambah ukuran tampilan sendiri |
| Jarak | `--s1` sampai `--s8`: 4, 8, 12, 16, 24, 32, 48, 64 px |
| Radius | `--r-sm` 8, `--r-lg` 16, `--r-pill` |
| Bayangan | `--shadow-pop`, hanya untuk dialog, lembar samping, toast, dan tombol mengambang |
| Warna peran | `--hero-bg`, `--on-hero`, `--paper*` (lembar cetak selalu putih), `--on-strong` |

Tombol: `primary` (satu aksi utama per layar), `secondary` (bergaris tepi; `.outline` alias lama), `ghost` (teks bergaris bawah), `danger`. Paragraf rata kiri-kanan hanya di wadah selebar 560 px ke atas (container query). Galat formulir tampil di bawah kolomnya.
