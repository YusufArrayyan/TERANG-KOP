// Uji perilaku prototipe di peramban: semua layar dan lima skenario PRD,
// di lebar desktop dan ponsel (terang dan gelap), memeriksa galat konsol dan luapan horizontal.
// Jalankan: node build.mjs && node tests/ui-smoke.mjs
// Memakai playwright-core dari @playwright/cli global bila tidak ada di proyek.
import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright-core'); } catch {
  const g = execSync('npm root -g').toString().trim();
  pw = require(join(g, '@playwright/cli/node_modules/playwright-core'));
}
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(join(root, 'dist', 'terang-kop.html')).href;

const RUTE = {
  ANG: ['beranda', 'riwayat', 'koperasi', 'rat', 'cetak', 'cara-skor', 'tentang'],
  PNG: ['beranda', 'catat', 'catat?j=T05', 'catat?j=T06&p=PJ-04', 'buku', 'buku/E0269', 'anggota', 'anggota?t=pinjaman', 'anggota/A04', 'tutup', 'rat', 'tiket', 'tiket/TK-015'],
  PGW: ['tinjau', 'rat', 'verifikasi', 'buku'],
  KJD: ['asuhan', 'asuhan/KOP-01', 'tiket', 'tiket/TK-015'],
  DIN: ['wilayah', 'wilayah?s=Waspada', 'wilayah/KOP-01', 'kpi', 'ambang', 'ekspor']
};
const VARIAN = [
  { nama: 'desktop terang', viewport: { width: 1280, height: 860 }, scheme: 'light' },
  { nama: 'ponsel terang', viewport: { width: 375, height: 812 }, scheme: 'light' },
  { nama: 'ponsel gelap', viewport: { width: 375, height: 812 }, scheme: 'dark' }
];

let gagal = 0;
const cek = (ok, pesan) => { console.log((ok ? '  ✓ ' : '  ✗ ') + pesan); if (!ok) gagal++; };

// Bila browser bawaan versi pustaka belum diunduh, pakai Chromium Playwright lain yang sudah ada.
let executablePath;
const pwDir = join(process.env.LOCALAPPDATA || join(process.env.HOME || '', '.cache'), 'ms-playwright');
if (existsSync(pwDir)) {
  for (const d of readdirSync(pwDir).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    const exe = join(pwDir, d, 'chrome-win64', 'chrome.exe');
    if (existsSync(exe)) { executablePath = exe; break; }
  }
}
let browser;
try { browser = await pw.chromium.launch(); } catch { browser = await pw.chromium.launch({ executablePath }); }
for (const v of VARIAN) {
  console.log(`\n${v.nama} (${v.viewport.width}px)`);
  const page = await browser.newPage({ viewport: v.viewport, colorScheme: v.scheme });
  const galat = [];
  page.on('console', (m) => { if (m.type() === 'error') galat.push(m.text()); });
  page.on('pageerror', (e) => galat.push(String(e)));
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  cek(await page.locator('#lp-h1').isVisible(), 'halaman depan publik tampil tanpa sesi');
  const lp = await page.evaluate(async () => {
    const w = (t) => new Promise((r) => setTimeout(r, t || 60));
    const nilai = () => +document.querySelector('#lp-skor [data-skor]').dataset.skor;
    const a = nilai();
    document.querySelector('[data-lp-tagih="PJ-04"]').click(); await w();
    document.querySelector('[data-lp-tagih="PJ-06"]').click(); await w();
    const b = nilai();
    document.querySelector('[data-act="lp-lembar"][data-k="ba"]').click(); await w(300);
    const ba = document.getElementById('lp-sheet').innerText.includes('Berita acara');
    const ov = document.documentElement.scrollWidth > innerWidth + 1;
    location.hash = '#/masuk'; await w();
    const masuk = !!document.querySelector('[data-form="masuk"]');
    return { a, b, ba, ov, masuk };
  });
  cek(lp.a === 70 && lp.b === 94, `halaman depan: centang dua angsuran mengubah skor ${lp.a} menjadi ${lp.b} (mesin yang sama)`);
  cek(lp.ba && !lp.ov && lp.masuk, 'halaman depan: lembar berita acara, tanpa luapan, tautan ke layar masuk');
  const hasil = await page.evaluate(async (RUTE) => {
    const w = (t) => new Promise((r) => setTimeout(r, t || 60));
    const out = [];
    for (const p in RUTE) {
      App.session = { peran: p, anggota_id: 'A04' }; App.saveSession();
      for (const r of RUTE[p]) {
        location.hash = '#/' + App.PERAN[p].kode + '/' + r; await w();
        const err = document.body.innerText.includes('tidak dapat ditampilkan');
        const ov = document.documentElement.scrollWidth > innerWidth + 1;
        out.push({ r: p + '/' + r, err, ov, sw: document.documentElement.scrollWidth });
      }
    }
    return out;
  }, RUTE);
  const buruk = hasil.filter((x) => x.err || x.ov);
  cek(buruk.length === 0, `${hasil.length} layar tanpa galat render dan tanpa luapan horizontal` + (buruk.length ? ': ' + buruk.map((x) => x.r + (x.ov ? ' sw=' + x.sw : ' ERR')).join(', ') : ''));

  // Lima skenario PRD lewat aksi antarmuka.
  const sk = await page.evaluate(async () => {
    const w = (t) => new Promise((r) => setTimeout(r, t || 80));
    const q = (s) => document.querySelector(s);
    const ok = async () => { await w(); q('[data-dlg="1"]').click(); await w(); };
    const as = async (p, h) => { App.session = { peran: p, anggota_id: 'A04' }; App.saveSession(); location.hash = h; await w(); };
    const r = {};
    App.reset();
    r.sep = App.state.skor.find((x) => x.periode_id === '2026-09');
    r.okt0 = TK.pratinjauSkor(App.state, '2026-10', App.today()).skor.nilai;
    // 1. Pemulihan, luring lalu sinkron
    App.state.online = false; App.save();
    for (const pj of ['PJ-04', 'PJ-06']) { await as('PNG', '#/png/catat?j=T06&p=' + pj); q('[data-form="catat"]').requestSubmit(); await w(); }
    r.antre = App.state.antrean.length;
    q('[data-act="koneksi"]').click(); await w(); q('[data-act="sinkron"]').click(); await w();
    r.okt1 = TK.pratinjauSkor(App.state, '2026-10', App.today()).skor;
    const n = App.state.entri.length; App.acts['demo-ulang'](); await w(); r.idem = App.state.entri.length === n;
    await as('PNG', '#/png/tutup'); q('[data-act="tutup-buku"]').click(); await ok();
    await as('PGW', '#/pgw/tinjau'); q('[data-act="sahkan"]').click(); await ok();
    r.terbit = TK.cariPeriode(App.state, '2026-10').status;
    // 2. RAT
    await as('PNG', '#/png/rat'); q('[data-act="terbit-paket"]').click(); await ok();
    await as('ANG', '#/ang/rat'); q('[data-act="baca-paket"]').click(); await w(); q('#dlg [data-close]').click(); await w();
    await as('PNG', '#/png/rat'); q('[data-act="mulai-rat"]').click(); await ok();
    await as('ANG', '#/ang/rat'); q('#kode').value = '0000'; q('[data-form="hadir"]').requestSubmit(); await w();
    r.kodeSalah = !!q('#kode-err').innerText;
    q('#kode').value = App.state.rat.kode_hadir; q('[data-form="hadir"]').requestSubmit(); await w();
    App.acts['demo-hadir'](); await w();
    for (const ag of ['AG1', 'AG2', 'AG3']) { q('[data-act="suara"][data-ag="' + ag + '"]').click(); await ok(); }
    r.suaraTetap = !TK.kirimSuara(App.state, 'AG1', 'A04', 'Abstain').ok;
    await as('PNG', '#/png/rat'); q('[data-act="tutup-rat"]').click(); await ok();
    r.ba = !!App.state.rat.berita_acara;
    // 3. Dinas
    await as('DIN', '#/din/wilayah/KOP-01'); q('[data-act="hitung-ulang"]').click(); await w();
    r.hu = App._hitungUlang.hasil.every((x) => x.sama);
    r.wil = App.wilayah().length;
    // 4. Perlu tindakan (dari data awal)
    App.reset(); App.acts['demo-krisis'](); await w();
    q('[data-act="tutup-buku"]').click(); await ok();
    const t = App.state.tiket[App.state.tiket.length - 1];
    r.tl = { id: t.id, jenis: t.jenis, hari: TK.tgl.diffDays(t.tenggat, t.dibuat), nilai: TK.cariPeriode(App.state, '2026-10') && App.state.skor.find((x) => x.periode_id === '2026-10').nilai };
    await as('ANG', '#/ang/beranda'); r.berandaTL = !!q('.callout.bad');
    // 5. Keutuhan
    App.acts['demo-ubah'](); await w();
    await as('PGW', '#/pgw/buku'); q('[data-act="keutuhan"]').click(); await w();
    r.rusak = App._keutuhan.pertama;
    App.acts['demo-pulih'](); await w(); r.pulih = App._keutuhan.ok;
    // 6. Pengingat tanggal 10
    App.reset(); r.kas = TK.validasi(App.state, { jenis: 'T09', tanggal: App.today(), nominal: 50000000 });
    App.state.tanggalSimulasi = '2026-11-09'; const pg = TK.periksaPengingat(App.state); App.save();
    r.pengingat = pg.length === 1 && pg[0].jenis === 'Pengingat' && pg[0].tenggat === '2026-11-10';
    App.state.tanggalSimulasi = '2026-11-11'; r.pengingatTelat = App.terlambat(pg[0]);
    // Ekspor dinas
    await as('DIN', '#/din/ekspor'); r.ekspor = document.querySelectorAll('[data-act="ekspor"]').length === 8 && App.keCSV([{ a: 'x,y', b: 1 }]) === 'a,b' + String.fromCharCode(10) + '"x,y",1';
    return r;
  });
  cek(sk.sep.nilai === 78 && sk.sep.status === 'Waspada' && sk.sep.rincian.find((i) => i.kode === 'L').warna === 'kuning', `September ${sk.sep.nilai} ${sk.sep.status}, likuiditas kuning (konsep v1.0)`);
  cek(sk.okt0 === 70, `pratinjau Oktober sebelum penagihan ${sk.okt0} (PRD: 70)`);
  cek(sk.antre === 2, 'dua angsuran masuk antrean luring');
  cek(sk.okt1.nilai === 94 && sk.okt1.status === 'Sehat', `setelah penagihan ${sk.okt1.nilai} ${sk.okt1.status} (PRD: 94 Sehat)`);
  cek(sk.idem, 'sinkron ulang tidak menggandakan entri');
  cek(sk.terbit === 'Terbit', 'tutup buku dan pengesahan pengawas');
  cek(sk.kodeSalah && sk.suaraTetap && sk.ba, 'RAT: kode salah ditolak, suara terkunci, berita acara terbentuk');
  cek(sk.hu && sk.wil === 30, 'dinas: 30 koperasi, hitung ulang sama untuk semua periode');
  cek(sk.tl.jenis === 'Tindak lanjut' && sk.tl.hari === 14 && sk.berandaTL, `penarikan besar + beban besar: skor ${sk.tl.nilai}, ${sk.tl.id} Tindak lanjut 14 hari, tampil di beranda anggota`);
  cek(!sk.kas.ok && sk.kas.tinjau, 'pengeluaran melebihi saldo kas ditolak (Perlu ditinjau saat sinkron)');
  cek(sk.pengingat && sk.pengingatTelat, 'Pengingat tanggal 10 dibuat dan bertanda Terlambat setelah tenggat');
  cek(sk.ekspor, 'layar Ekspor dinas: empat set data, CSV ter-escape benar');
  cek(sk.rusak === 'E0269' && sk.pulih, 'keutuhan: E0269 ditunjuk, rantai pulih');
  cek(galat.length === 0, 'tidak ada galat konsol' + (galat.length ? ': ' + galat.slice(0, 3).join(' | ') : ''));
  await page.close();
}
await browser.close();
console.log(gagal ? `\n${gagal} pemeriksaan gagal` : '\nSemua pemeriksaan lulus');
process.exit(gagal ? 1 : 0);
