/* TERANG-KOP — mesin aturan murni.
 * Semua fungsi di sini deterministik: masukan sama menghasilkan keluaran sama.
 * Tidak menyentuh DOM, sehingga bisa diuji di Node. */
(function (root) {
  'use strict';

  /* ---------- SHA-256 (sinkron, tanpa dependensi) ---------- */
  var K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) {
        var c2 = str.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  function sha256(str) {
    var bytes = utf8(String(str));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255,
      (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var W = new Array(64);
    for (var off = 0; off < bytes.length; off += 64) {
      for (var t = 0; t < 16; t++) {
        W[t] = (bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) | (bytes[off + t * 4 + 2] << 8) | bytes[off + t * 4 + 3];
      }
      for (t = 16; t < 64; t++) {
        var x = W[t - 15], y = W[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K256[t] + W[t]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var hex = '';
    for (var i = 0; i < 8; i++) hex += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return hex;
  }

  /* ---------- Tanggal (string YYYY-MM-DD, dihitung di UTC) ---------- */
  function toD(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function fromD(d) { return d.toISOString().slice(0, 10); }
  function addDays(s, n) { var d = toD(s); d.setUTCDate(d.getUTCDate() + n); return fromD(d); }
  function addMonths(s, n) {
    var d = toD(s), day = d.getUTCDate();
    var t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
    var last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    t.setUTCDate(Math.min(day, last));
    return fromD(t);
  }
  function diffDays(a, b) { return Math.round((toD(a) - toD(b)) / 86400000); }
  function periodeOf(s) { return s.slice(0, 7); }
  function awalPeriode(p) { return p + '-01'; }
  function akhirPeriode(p) { var y = +p.slice(0, 4), m = +p.slice(5, 7); return fromD(new Date(Date.UTC(y, m, 0))); }
  function periodeBerikut(p) { return periodeOf(addMonths(awalPeriode(p), 1)); }
  function periodeSebelum(p) { return periodeOf(addMonths(awalPeriode(p), -1)); }
  function addWorkingDays(s, n) {
    var d = s, added = 0;
    while (added < n) { d = addDays(d, 1); var w = toD(d).getUTCDay(); if (w !== 0 && w !== 6) added++; }
    return d;
  }
  function minTgl(a, b) { return a < b ? a : b; }

  /* ---------- Bagan akun dan jenis transaksi ---------- */
  var AKUN = {
    '1101': { nama: 'Kas', tipe: 'aset' },
    '1102': { nama: 'Bank', tipe: 'aset' },
    '1201': { nama: 'Piutang pinjaman anggota', tipe: 'aset' },
    '1202': { nama: 'Penyisihan pinjaman bermasalah', tipe: 'aset', kontra: true },
    '2101': { nama: 'Simpanan sukarela', tipe: 'kewajiban' },
    '2201': { nama: 'Utang bank', tipe: 'kewajiban' },
    '3101': { nama: 'Simpanan pokok', tipe: 'ekuitas' },
    '3102': { nama: 'Simpanan wajib', tipe: 'ekuitas' },
    '3201': { nama: 'Cadangan', tipe: 'ekuitas' },
    '4101': { nama: 'Pendapatan jasa pinjaman', tipe: 'pendapatan' },
    '4201': { nama: 'Pendapatan penjualan gerai', tipe: 'pendapatan' },
    '5101': { nama: 'Beban operasional', tipe: 'beban' },
    '5201': { nama: 'Beban pokok penjualan', tipe: 'beban' },
    '5301': { nama: 'Beban penyisihan', tipe: 'beban' },
    '5401': { nama: 'Beban bunga bank', tipe: 'beban' }
  };

  var JENIS = {
    T01: { nama: 'Setoran simpanan pokok', d: '1101', k: '3101', anggota: true },
    T02: { nama: 'Setoran simpanan wajib', d: '1101', k: '3102', anggota: true },
    T03: { nama: 'Setoran simpanan sukarela', d: '1101', k: '2101', anggota: true },
    T04: { nama: 'Penarikan simpanan sukarela', d: '2101', k: '1101', anggota: true },
    T05: { nama: 'Pencairan pinjaman anggota', d: '1201', k: '1101', anggota: true },
    T06: { nama: 'Angsuran pinjaman', d: '1101', k: '1201 + 4101', anggota: true, pinjaman: true },
    T07: { nama: 'Penjualan gerai', d: '1101', k: '4201' },
    T08: { nama: 'Pembelian barang gerai', d: '5201', k: '1101' },
    T09: { nama: 'Beban operasional', d: '5101', k: '1101' },
    T10: { nama: 'Penerimaan pinjaman bank', d: '1102', k: '2201' },
    T11: { nama: 'Bayar angsuran bank', d: '2201 + 5401', k: '1102' },
    T12: { nama: 'Penyisihan pinjaman bermasalah', d: '5301', k: '1202' },
    T13: { nama: 'Entri pembalik (koreksi)', d: 'kredit entri asal', k: 'debit entri asal' }
  };

  /* ---------- Ambang skor (versi awal simulasi) ---------- */
  var AMBANG_V1 = {
    id: 'AMB-1', versi: 'v1.0', disetujui_oleh: 'Dinas Koperasi dan UKM Kab. Tanah Terang', tanggal: '2026-01-05',
    isi: {
      P: { nama: 'Perlindungan', arah: 'naik', hijau: 1.0, kuning: 0.5, bobot: 10, satuan: 'persen',
        rumus: 'Penyisihan (1202) ÷ pinjaman menunggak > 30 hari', saran: 'Tambah penyisihan untuk pinjaman yang macet.' },
      E: { nama: 'Struktur keuangan', arah: 'turun', hijau: 1.5, kuning: 3, bobot: 15, satuan: 'rasio',
        rumus: '(2101 + 2201) ÷ (3101 + 3102 + 3201 + SHU berjalan)', saran: 'Kurangi utang atau perkuat modal sendiri.' },
      A: { nama: 'Kualitas aset', arah: 'turun', hijau: 0.05, kuning: 0.10, bobot: 20, satuan: 'persen',
        rumus: 'Pinjaman menunggak > 30 hari ÷ total pinjaman beredar', saran: 'Tagih angsuran yang terlambat.' },
      R: { nama: 'Imbal hasil dan biaya', arah: 'turun', hijau: 0.80, kuning: 1.00, bobot: 15, satuan: 'persen',
        rumus: 'Total beban ÷ total pendapatan (tahun buku berjalan)', saran: 'Tekan beban atau naikkan pendapatan.' },
      L: { nama: 'Likuiditas', arah: 'naik', hijau: 1.0, kuning: 0.5, bobot: 20, satuan: 'rasio',
        rumus: '(Kas + bank) ÷ (simpanan sukarela + angsuran bank bulan berjalan)', saran: 'Jaga kas cukup untuk penarikan dan angsuran bank.' },
      S: { nama: 'Tanda pertumbuhan', arah: 'naik', hijau: 0.60, kuning: 0.40, bobot: 10, satuan: 'persen',
        rumus: 'Anggota aktif 3 bulan terakhir ÷ seluruh anggota', saran: 'Ajak anggota kembali bertransaksi.' },
      T: { nama: 'Partisipasi', arah: 'naik', hijau: 0.60, kuning: 0.30, bobot: 10, satuan: 'persen',
        rumus: 'Anggota yang membuka ringkasan dalam 90 hari ÷ seluruh anggota', saran: 'Bagikan ringkasan di pertemuan bulanan.' }
    }
  };
  var URUTAN_IND = ['P', 'E', 'A', 'R', 'L', 'S', 'T'];
  var NILAI_WARNA = { hijau: 100, kuning: 60, merah: 20 };

  /* ---------- Rantai hash ---------- */
  var GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';
  function isiHash(e) {
    return JSON.stringify([e.id, e.seq, e.cid, e.tanggal, e.jenis, e.uraian || '', e.anggota_id || null,
      e.pinjaman_id || null, e.entri_asal_id || null, e.alasan || null,
      e.baris.map(function (b) { return [b.akun, b.debit || 0, b.kredit || 0]; })]);
  }
  function hashEntri(e, prev) { return sha256(prev + '|' + isiHash(e)); }

  function periksaKeutuhan(entri) {
    var prev = GENESIS;
    for (var i = 0; i < entri.length; i++) {
      var e = entri[i];
      if (e.prev_hash !== prev) return { ok: false, pertama: e.id, indeks: i, alasan: 'Hash sebelumnya tidak cocok', diperiksa: i + 1 };
      var h = hashEntri(e, prev);
      if (h !== e.hash) return { ok: false, pertama: e.id, indeks: i, alasan: 'Isi entri berubah setelah dicatat', diperiksa: i + 1 };
      prev = e.hash;
    }
    return { ok: true, diperiksa: entri.length, ujung: prev };
  }

  /* ---------- Pinjaman ---------- */
  function jadwalPinjaman(p) {
    var pokokPer = Math.floor(p.pokok / p.tenor);
    var jasa = Math.round(p.pokok * p.jasa_persen / 100);
    var out = [];
    for (var k = 1; k <= p.tenor; k++) {
      var pk = k === p.tenor ? p.pokok - pokokPer * (p.tenor - 1) : pokokPer;
      out.push({ ke: k, jatuh_tempo: addMonths(p.tanggal_cair, k), pokok: pk, jasa: jasa, total: pk + jasa });
    }
    return out;
  }
  function pokokDibayar(entri, pinjamanId, sampai) {
    var s = 0;
    for (var i = 0; i < entri.length; i++) {
      var e = entri[i];
      if (e.pinjaman_id !== pinjamanId || e.tanggal > sampai) continue;
      for (var j = 0; j < e.baris.length; j++) {
        var b = e.baris[j];
        if (b.akun === '1201') s += (b.kredit || 0) - (e.jenis === 'T05' ? 0 : (b.debit || 0));
      }
    }
    return s;
  }
  function statusPinjaman(state, p, asOf) {
    if (p.tanggal_cair > asOf) return null;
    var jadwal = jadwalPinjaman(p);
    var dibayar = pokokDibayar(state.entri, p.id, asOf);
    var sisa = p.pokok - dibayar;
    var harus = 0, tunggakan = [], kumul = 0;
    for (var i = 0; i < jadwal.length; i++) {
      kumul += jadwal[i].pokok;
      if (jadwal[i].jatuh_tempo <= asOf) {
        harus = kumul;
        if (dibayar < kumul) tunggakan.push(jadwal[i]);
      }
    }
    var hari = tunggakan.length ? diffDays(asOf, tunggakan[0].jatuh_tempo) : 0;
    var berikut = null;
    var kum2 = 0;
    for (i = 0; i < jadwal.length; i++) {
      kum2 += jadwal[i].pokok;
      if (dibayar < kum2 && jadwal[i].jatuh_tempo > asOf) { berikut = jadwal[i]; break; }
    }
    var status = sisa <= 0 ? 'Lunas' : (hari > 30 ? 'Menunggak' : (hari > 0 ? 'Terlambat' : 'Lancar'));
    return {
      id: p.id, sisa: Math.max(0, sisa), dibayar: dibayar, harus: harus, hari_tunggak: hari,
      tunggakan: tunggakan, berikut: berikut, status: status, menunggak30: sisa > 0 && hari > 30, jadwal: jadwal
    };
  }

  /* ---------- Saldo ---------- */
  function saldoAkun(entri, sampai, dari) {
    var s = {};
    for (var k in AKUN) s[k] = 0;
    for (var i = 0; i < entri.length; i++) {
      var e = entri[i];
      if (e.tanggal > sampai) continue;
      if (dari && e.tanggal < dari) continue;
      for (var j = 0; j < e.baris.length; j++) {
        var b = e.baris[j];
        s[b.akun] += (b.debit || 0) - (b.kredit || 0);
      }
    }
    return s; // positif = saldo debit
  }
  function saldoAnggota(state, anggotaId, sampai) {
    var r = { pokok: 0, wajib: 0, sukarela: 0 };
    var map = { '3101': 'pokok', '3102': 'wajib', '2101': 'sukarela' };
    for (var i = 0; i < state.entri.length; i++) {
      var e = state.entri[i];
      if (e.anggota_id !== anggotaId || (sampai && e.tanggal > sampai)) continue;
      for (var j = 0; j < e.baris.length; j++) {
        var b = e.baris[j];
        if (map[b.akun]) r[map[b.akun]] += (b.kredit || 0) - (b.debit || 0);
      }
    }
    r.total = r.pokok + r.wajib + r.sukarela;
    return r;
  }
  function labaRugi(entri, dari, sampai) {
    var s = saldoAkun(entri, sampai, dari);
    var pendapatan = -(s['4101'] + s['4201']);
    var beban = s['5101'] + s['5201'] + s['5301'] + s['5401'];
    return {
      rinci: s, pendapatan: pendapatan, beban: beban, shu: pendapatan - beban,
      jasa: -s['4101'], penjualan: -s['4201'], operasional: s['5101'], hpp: s['5201'], penyisihan: s['5301'], bunga: s['5401']
    };
  }
  function neraca(entri, sampai, tahunMulai) {
    var s = saldoAkun(entri, sampai);
    var lr = labaRugi(entri, tahunMulai, sampai);
    return {
      kas: s['1101'], bank: s['1102'], piutang: s['1201'], penyisihan: s['1202'],
      aset: s['1101'] + s['1102'] + s['1201'] + s['1202'],
      sukarela: -s['2101'], utangBank: -s['2201'], kewajiban: -(s['2101'] + s['2201']),
      pokok: -s['3101'], wajib: -s['3102'], cadangan: -s['3201'], shu: lr.shu,
      ekuitas: -(s['3101'] + s['3102'] + s['3201']) + lr.shu
    };
  }

  /* ---------- Ringkasan periode → masukan skor ---------- */
  function ringkasanPeriode(state, periodeId, asOfOpsional) {
    var akhir = akhirPeriode(periodeId);
    var asOf = asOfOpsional ? minTgl(akhir, asOfOpsional) : akhir;
    var tahun = periodeId.slice(0, 4) + '-01-01';
    var entri = state.entri;
    var s = saldoAkun(entri, asOf);
    var lr = labaRugi(entri, tahun, asOf);
    var beredar = 0, menunggak = 0;
    state.pinjaman.forEach(function (p) {
      var st = statusPinjaman(state, p, asOf);
      if (!st) return;
      beredar += st.sisa;
      if (st.menunggak30) menunggak += st.sisa;
    });
    var tigaBulan = addMonths(asOf, -3);
    var aktif = {};
    entri.forEach(function (e) { if (e.anggota_id && e.tanggal > tigaBulan && e.tanggal <= asOf) aktif[e.anggota_id] = 1; });
    var sembilanPuluh = addDays(asOf, -90);
    var buka = {};
    (state.logRingkasan || []).forEach(function (l) { if (l.tanggal > sembilanPuluh && l.tanggal <= asOf) buka[l.anggota_id] = 1; });
    var anggotaTerdaftar = state.anggota.filter(function (a) { return a.bergabung <= asOf; }).length;
    var mulai = state.koperasi.mulai_buku;
    var bulanKe = (+periodeId.slice(0, 4) - +mulai.slice(0, 4)) * 12 + (+periodeId.slice(5, 7) - +mulai.slice(5, 7)) + 1;
    return {
      periode: periodeId, asOf: asOf, bulanKe: bulanKe,
      penyisihan: -s['1202'], menunggak: menunggak, beredar: beredar,
      sukarela: -s['2101'], utangBank: -s['2201'],
      modal: -(s['3101'] + s['3102'] + s['3201']), shu: lr.shu,
      beban: lr.beban, pendapatan: lr.pendapatan,
      kasBank: s['1101'] + s['1102'], angsuranBank: state.koperasi.angsuran_bank_bulanan || 0,
      aktif: Object.keys(aktif).length, buka: Object.keys(buka).length, anggota: anggotaTerdaftar
    };
  }

  /* ---------- Skor PEARLS adaptasi ---------- */
  function rasio(num, den) {
    if (den === 0 || den < 0) {
      if (num === 0) return { nilai: null, kosong: true };
      return { nilai: null, paksaMerah: true };
    }
    return { nilai: num / den };
  }
  function warnaDari(def, v) {
    if (def.arah === 'naik') return v >= def.hijau ? 'hijau' : (v >= def.kuning ? 'kuning' : 'merah');
    return v <= def.hijau ? 'hijau' : (v <= def.kuning ? 'kuning' : 'merah');
  }
  function hitungSkor(r, ambang) {
    var isi = (ambang || AMBANG_V1).isi;
    var raw = {
      P: r.menunggak === 0 ? { nilai: null, kosong: true, catatan: 'Tidak ada pinjaman menunggak' } : rasio(r.penyisihan, r.menunggak),
      E: rasio(r.sukarela + r.utangBank, r.modal + r.shu),
      A: rasio(r.menunggak, r.beredar),
      R: rasio(r.beban, r.pendapatan),
      L: rasio(r.kasBank, r.sukarela + r.angsuranBank),
      S: rasio(r.aktif, r.anggota),
      T: rasio(r.buka, r.anggota)
    };
    var indikator = URUTAN_IND.map(function (kode) {
      var def = isi[kode], x = raw[kode], warna;
      if (x.kosong) warna = 'hijau';
      else if (x.paksaMerah) warna = 'merah';
      else warna = warnaDari(def, x.nilai);
      var skor = NILAI_WARNA[warna];
      return {
        kode: kode, nama: def.nama, nilai: x.nilai, warna: warna, skor: skor, bobot: def.bobot,
        kontribusi: def.bobot * skor / 100, hilang: def.bobot * (100 - skor) / 100,
        catatan: x.catatan || (x.kosong ? 'Tidak ada data' : (x.paksaMerah ? 'Tidak bisa dihitung: pembaginya nol atau negatif' : null)),
        rumus: def.rumus, saran: def.saran, satuan: def.satuan
      };
    });
    var total = 0;
    indikator.forEach(function (i) { total += i.bobot * i.skor; });
    var nilai = Math.round(total / 100);
    var status = nilai >= 80 ? 'Sehat' : (nilai >= 55 ? 'Waspada' : 'Perlu tindakan');
    var dasar = status;
    var aturan = [];
    var merah = indikator.filter(function (i) { return i.warna === 'merah'; });
    var L = indikator[4];
    if (L.warna === 'merah' && status === 'Sehat') { status = 'Waspada'; aturan.push('Likuiditas merah, status minimal Waspada.'); }
    if (merah.length >= 2 && status !== 'Perlu tindakan') { status = 'Perlu tindakan'; aturan.push('Dua indikator atau lebih merah, status Perlu tindakan.'); }
    else if (merah.length >= 2) aturan.push('Dua indikator atau lebih merah.');
    var kalibrasi = r.bulanKe <= 3;
    if (kalibrasi) { aturan.push('Bulan buku ke-' + r.bulanKe + ' dari 3 masa kalibrasi; status belum dijatuhkan.'); }
    var penurun = indikator.filter(function (i) { return i.hilang > 0; })
      .sort(function (a, b) { return b.hilang - a.hilang || URUTAN_IND.indexOf(a.kode) - URUTAN_IND.indexOf(b.kode); });
    return {
      nilai: nilai, status: kalibrasi ? 'Dikalibrasi' : status, statusDasar: dasar, statusTanpaKalibrasi: status,
      indikator: indikator, aturan: aturan, penurun: penurun, jumlahMerah: merah.length,
      ambang_versi: (ambang || AMBANG_V1).versi
    };
  }

  /* ---------- Validasi dan pencatatan entri ---------- */
  function buatBaris(draft, state) {
    var n = draft.nominal;
    var j = draft.jenis;
    if (j === 'T06') {
      return [{ akun: '1101', debit: (draft.pokok || 0) + (draft.jasa || 0), kredit: 0 },
        { akun: '1201', debit: 0, kredit: draft.pokok || 0 },
        { akun: '4101', debit: 0, kredit: draft.jasa || 0 }].filter(function (b) { return b.debit || b.kredit || b.akun === '1101'; });
    }
    if (j === 'T11') {
      return [{ akun: '2201', debit: draft.pokok || 0, kredit: 0 },
        { akun: '5401', debit: draft.jasa || 0, kredit: 0 },
        { akun: '1102', debit: 0, kredit: (draft.pokok || 0) + (draft.jasa || 0) }].filter(function (b) { return b.debit || b.kredit || b.akun === '1102'; });
    }
    if (j === 'T13') {
      var asal = state && cariEntri(state, draft.entri_asal_id);
      if (!asal) return [];
      return asal.baris.map(function (b) { return { akun: b.akun, debit: b.kredit || 0, kredit: b.debit || 0 }; });
    }
    var def = JENIS[j];
    if (!def) return [];
    return [{ akun: def.d, debit: n, kredit: 0 }, { akun: def.k, debit: 0, kredit: n }];
  }
  function cariEntri(state, id) {
    for (var i = 0; i < state.entri.length; i++) if (state.entri[i].id === id) return state.entri[i];
    return null;
  }
  function statusPeriode(state, periodeId) {
    for (var i = 0; i < state.periode.length; i++) if (state.periode[i].id === periodeId) return state.periode[i].status;
    return 'Terbuka';
  }
  function bulat(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }

  /* Mengembalikan { ok, galat: [{field, pesan}], tinjau: bool }.
   * tinjau = true bila galat berasal dari aturan saldo (bukan isian formulir). */
  function validasi(state, draft) {
    var galat = [], tinjau = false;
    var def = JENIS[draft.jenis];
    if (!def) { galat.push({ field: 'jenis', pesan: 'Pilih jenis transaksi.' }); return { ok: false, galat: galat }; }
    if (!draft.tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(draft.tanggal)) galat.push({ field: 'tanggal', pesan: 'Isi tanggal transaksi.' });
    else {
      var st = statusPeriode(state, periodeOf(draft.tanggal));
      if (st !== 'Terbuka') galat.push({ field: 'tanggal', pesan: 'Periode ' + namaPeriode(periodeOf(draft.tanggal)) + ' sudah ditutup. Catat koreksi di periode berjalan dengan entri pembalik.' });
      if (draft.tanggal > state.tanggalSimulasi) galat.push({ field: 'tanggal', pesan: 'Tanggal tidak boleh melewati hari ini (' + fmtTgl(state.tanggalSimulasi) + ').' });
      if (draft.tanggal < state.koperasi.mulai_buku) galat.push({ field: 'tanggal', pesan: 'Tanggal sebelum awal buku koperasi.' });
    }
    if (def.anggota && !draft.anggota_id) galat.push({ field: 'anggota_id', pesan: 'Pilih anggota.' });
    if (draft.jenis === 'T06' || draft.jenis === 'T11') {
      if (!bulat(draft.pokok) || draft.pokok < 0) galat.push({ field: 'pokok', pesan: 'Pokok harus bilangan bulat rupiah.' });
      if (!bulat(draft.jasa) || draft.jasa < 0) galat.push({ field: 'jasa', pesan: draft.jenis === 'T06' ? 'Jasa harus bilangan bulat rupiah.' : 'Bunga harus bilangan bulat rupiah.' });
      if ((draft.pokok || 0) + (draft.jasa || 0) <= 0) galat.push({ field: 'pokok', pesan: 'Nominal harus lebih dari nol.' });
    } else if (draft.jenis !== 'T13') {
      if (!bulat(draft.nominal) || draft.nominal <= 0) galat.push({ field: 'nominal', pesan: 'Nominal harus bilangan bulat rupiah lebih dari nol, tanpa sen.' });
    }
    if (draft.jenis === 'T06') {
      var p = state.pinjaman.filter(function (x) { return x.id === draft.pinjaman_id; })[0];
      if (!p) galat.push({ field: 'pinjaman_id', pesan: 'Pilih pinjaman yang diangsur.' });
      else {
        if (p.anggota_id !== draft.anggota_id) galat.push({ field: 'pinjaman_id', pesan: 'Pinjaman ini bukan milik anggota yang dipilih.' });
        var stp = statusPinjaman(state, p, draft.tanggal || state.tanggalSimulasi);
        if (stp && draft.pokok > stp.sisa) { galat.push({ field: 'pokok', pesan: 'Pokok melebihi sisa pinjaman. Isi paling banyak ' + rp(stp.sisa) + '.' }); tinjau = true; }
      }
    }
    if (draft.jenis === 'T05') {
      if (!bulat(draft.tenor) || draft.tenor < 1 || draft.tenor > 36) galat.push({ field: 'tenor', pesan: 'Tenor 1 sampai 36 bulan.' });
      if (typeof draft.jasa_persen !== 'number' || draft.jasa_persen < 0 || draft.jasa_persen > 5) galat.push({ field: 'jasa_persen', pesan: 'Jasa 0 sampai 5 persen per bulan.' });
    }
    if (draft.jenis === 'T04' && draft.anggota_id && bulat(draft.nominal)) {
      var sal = saldoAnggota(state, draft.anggota_id).sukarela;
      if (draft.nominal > sal) { galat.push({ field: 'nominal', pesan: 'Penarikan ' + rp(draft.nominal) + ' melebihi saldo sukarela anggota. Isi paling banyak ' + rp(sal) + '.' }); tinjau = true; }
    }
    // Uang keluar tidak boleh melebihi saldo kas atau bank (aturan saldo, diperiksa ulang saat sinkron).
    var sumber = { T04: '1101', T05: '1101', T08: '1101', T09: '1101', T11: '1102' }[draft.jenis];
    if (sumber && galat.length === 0) {
      var keluar = draft.jenis === 'T11' ? (draft.pokok || 0) + (draft.jasa || 0) : draft.nominal;
      var saldo = saldoAkun(state.entri, '9999-12-31')[sumber];
      if (keluar > saldo) {
        galat.push({ field: draft.jenis === 'T11' ? 'pokok' : 'nominal', pesan: 'Saldo ' + AKUN[sumber].nama.toLowerCase() + ' tinggal ' + rp(saldo) + ', tidak cukup untuk ' + rp(keluar) + '. Kurangi nominalnya, atau catat dulu uang yang masuk.' });
        tinjau = true;
      }
    }
    if (draft.jenis === 'T13') {
      if (!draft.alasan || draft.alasan.trim().length < 5) galat.push({ field: 'alasan', pesan: 'Tulis alasan koreksi, minimal lima huruf.' });
      var asal = cariEntri(state, draft.entri_asal_id);
      if (!asal) galat.push({ field: 'entri_asal_id', pesan: 'Entri asal tidak ditemukan.' });
      else if (asal.jenis === 'T13') galat.push({ field: 'entri_asal_id', pesan: 'Entri pembalik tidak dapat dibalik lagi. Catat transaksi yang benar sebagai entri baru.' });
      else if (state.entri.some(function (e) { return e.entri_asal_id === asal.id; })) galat.push({ field: 'entri_asal_id', pesan: 'Entri ' + asal.id + ' sudah pernah dibalik.' });
    }
    var baris = buatBaris(draft, state);
    if (galat.length === 0) {
      var d = 0, k = 0;
      baris.forEach(function (b) { d += b.debit || 0; k += b.kredit || 0; if (!bulat(b.debit || 0) || !bulat(b.kredit || 0)) galat.push({ field: 'nominal', pesan: 'Nominal harus bilangan bulat rupiah.' }); });
      if (d !== k) galat.push({ field: 'nominal', pesan: 'Debit dan kredit tidak seimbang. Periksa lagi nominal pokok dan jasa.' });
      if (d <= 0) galat.push({ field: 'nominal', pesan: 'Nominal harus lebih dari nol.' });
    }
    return { ok: galat.length === 0, galat: galat, tinjau: tinjau && galat.every(function (g) { return g.field === 'nominal' || g.field === 'pokok'; }), baris: baris };
  }

  function tambahEntri(state, draft, oleh) {
    var v = validasi(state, draft);
    if (!v.ok) return { ok: false, galat: v.galat, tinjau: v.tinjau };
    if (draft.cid && state.entri.some(function (e) { return e.cid === draft.cid; })) return { ok: true, duplikat: true };
    var prev = state.entri.length ? state.entri[state.entri.length - 1].hash : GENESIS;
    var seq = state.entri.length + 1;
    var e = {
      id: 'E' + ('000' + seq).slice(-4), seq: seq, cid: draft.cid || ('cid-' + seq), tanggal: draft.tanggal,
      jenis: draft.jenis, uraian: draft.uraian || JENIS[draft.jenis].nama,
      anggota_id: draft.anggota_id || null, pinjaman_id: draft.pinjaman_id || null,
      entri_asal_id: draft.entri_asal_id || null, alasan: draft.alasan || null,
      baris: v.baris, oleh: oleh || 'PNG', prev_hash: prev
    };
    if (draft.jenis === 'T05') {
      var pid = draft.pinjaman_id_baru || ('PJ-' + ('0' + (state.pinjaman.length + 1)).slice(-2));
      state.pinjaman.push({ id: pid, anggota_id: draft.anggota_id, pokok: draft.nominal, tenor: draft.tenor, jasa_persen: draft.jasa_persen, tanggal_cair: draft.tanggal });
      e.pinjaman_id = pid;
    }
    if (draft.jenis === 'T13') {
      var asal = cariEntri(state, draft.entri_asal_id);
      e.anggota_id = asal.anggota_id; e.pinjaman_id = asal.pinjaman_id;
      e.uraian = 'Koreksi ' + asal.id + ': ' + draft.alasan.trim();
    }
    e.hash = hashEntri(e, prev);
    state.entri.push(e);
    return { ok: true, entri: e };
  }

  /* ---------- Sinkron luring ---------- */
  function sinkron(state, oleh) {
    var hasil = { masuk: [], tinjau: [], duplikat: [] };
    var sisa = [];
    (state.antrean || []).forEach(function (q) {
      if (q.status === 'Perlu ditinjau') { sisa.push(q); return; }
      var r = tambahEntri(state, q.draft, oleh);
      if (r.ok && r.duplikat) hasil.duplikat.push(q);
      else if (r.ok) { hasil.masuk.push(r.entri); }
      else { q.status = 'Perlu ditinjau'; q.galat = r.galat; hasil.tinjau.push(q); sisa.push(q); }
    });
    state.antrean = sisa;
    return hasil;
  }

  /* ---------- Periode, tutup buku, tiket ---------- */
  function cariPeriode(state, id) {
    for (var i = 0; i < state.periode.length; i++) if (state.periode[i].id === id) return state.periode[i];
    return null;
  }
  function periodeBerjalan(state) {
    var buka = state.periode.filter(function (p) { return p.status === 'Terbuka'; });
    return buka.length ? buka[0] : null;
  }
  function ambangAktif(state) { return state.ambang[state.ambang.length - 1]; }
  function cariAmbang(state, versi) { return state.ambang.filter(function (a) { return a.versi === versi; })[0] || ambangAktif(state); }

  function nomorTiketBerikut(state) {
    var max = state.nomorTiket || 0;
    state.nomorTiket = max + 1;
    return 'TK-' + ('00' + state.nomorTiket).slice(-3);
  }

  function buatTiketDariSkor(state, periodeId, skor, tanggal) {
    var dibuat = [];
    if (skor.status === 'Waspada') {
      var t = {
        id: nomorTiketBerikut(state), koperasi_id: state.koperasi.id, periode_id: periodeId, jenis: 'Pendampingan',
        status: 'Terbuka', dibuat: tanggal, tenggat: addWorkingDays(tanggal, 7),
        pemilik: 'KJD', pemilik_nama: state.koperasi.pendamping_utama, salinan: [state.koperasi.pendamping_cadangan],
        ringkasan: 'Skor ' + namaPeriode(periodeId) + ' ' + skor.nilai + ', Waspada. Kontak pertama dengan pengurus dalam 7 hari kerja.',
        penjelasan: '', catatan: []
      };
      state.tiket.push(t); dibuat.push(t);
    }
    if (skor.status === 'Perlu tindakan') {
      var t2 = {
        id: nomorTiketBerikut(state), koperasi_id: state.koperasi.id, periode_id: periodeId, jenis: 'Tindak lanjut',
        status: 'Terbuka', dibuat: tanggal, tenggat: addDays(tanggal, 14),
        pemilik: 'PNG', pemilik_nama: 'Pengurus ' + state.koperasi.nama_pendek,
        salinan: ['Pengawas', 'Dinas Koperasi', state.koperasi.pendamping_utama],
        ringkasan: 'Skor ' + namaPeriode(periodeId) + ' ' + skor.nilai + ', Perlu tindakan. Penyebab utama: ' +
          skor.penurun.slice(0, 2).map(function (i) { return i.nama.toLowerCase(); }).join(' dan ') + '.',
        penjelasan: '', catatan: []
      };
      state.tiket.push(t2); dibuat.push(t2);
    }
    return dibuat;
  }

  function pratinjauSkor(state, periodeId, asOf) {
    var r = ringkasanPeriode(state, periodeId, asOf);
    return { ringkasan: r, skor: hitungSkor(r, ambangAktif(state)) };
  }

  function tutupBuku(state, periodeId, oleh) {
    var p = cariPeriode(state, periodeId);
    if (!p) return { ok: false, pesan: 'Periode tidak ditemukan.' };
    if (p.status !== 'Terbuka') return { ok: false, pesan: 'Periode ' + namaPeriode(periodeId) + ' sudah ditutup.' };
    var sebelum = state.periode.filter(function (x) { return x.id < periodeId && x.status === 'Terbuka'; });
    if (sebelum.length) return { ok: false, pesan: 'Tutup dulu periode ' + namaPeriode(sebelum[0].id) + '.' };
    var menunggu = (state.antrean || []).filter(function (q) { return periodeOf(q.draft.tanggal) === periodeId; });
    if (menunggu.length) return { ok: false, pesan: 'Masih ada ' + menunggu.length + ' entri di antrean untuk periode ini. Sinkronkan atau tinjau dulu.' };
    var tanggal = state.tanggalSimulasi;
    var asOf = minTgl(akhirPeriode(periodeId), tanggal);
    var amb = ambangAktif(state);
    var r = ringkasanPeriode(state, periodeId, asOf);
    var sk = hitungSkor(r, amb);
    p.status = 'Ditutup'; p.ditutup_pada = tanggal; p.ditutup_oleh = oleh || 'PNG'; p.asOf = asOf;
    state.skor = state.skor.filter(function (x) { return x.periode_id !== periodeId; });
    var rec = {
      id: 'SK-' + periodeId, periode_id: periodeId, ambang_versi: amb.versi, asOf: asOf, nilai: sk.nilai, status: sk.status,
      rincian: sk.indikator.map(function (i) { return { kode: i.kode, nilai: i.nilai, warna: i.warna }; }),
      ujung_hash: state.entri.length ? state.entri[state.entri.length - 1].hash : GENESIS
    };
    state.skor.push(rec);
    var tiket = buatTiketDariSkor(state, periodeId, sk, tanggal);
    var berikut = periodeBerikut(periodeId);
    if (!cariPeriode(state, berikut)) state.periode.push({ id: berikut, status: 'Terbuka' });
    return { ok: true, skor: sk, rekam: rec, tiket: tiket };
  }

  function sahkanLaporan(state, periodeId, oleh) {
    var p = cariPeriode(state, periodeId);
    if (!p || p.status !== 'Ditutup') return { ok: false, pesan: 'Hanya laporan yang sudah ditutup yang dapat disahkan.' };
    p.status = 'Terbit'; p.disahkan_pada = state.tanggalSimulasi; p.disahkan_oleh = oleh || 'PGW'; p.terbit_pada = state.tanggalSimulasi;
    // Laporan terbit menutup tiket Pengingat periode itu.
    state.tiket.forEach(function (t) {
      if (t.jenis === 'Pengingat' && t.koperasi_id === state.koperasi.id && t.periode_id === periodeId && t.status !== 'Selesai') {
        t.status = 'Selesai'; t.selesai_pada = state.tanggalSimulasi;
        t.catatan.push({ oleh: 'Sistem', tanggal: state.tanggalSimulasi, teks: 'Laporan ' + namaPeriode(periodeId) + ' terbit. Pengingat ditutup.' });
      }
    });
    return { ok: true };
  }

  /* Pengingat tanggal 10: mulai tanggal 8, bila laporan bulan lalu belum terbit, buat satu tiket
   * untuk pengurus dengan salinan pendamping. Lewat tanggal 10 tiket bertanda Terlambat. */
  function periksaPengingat(state) {
    var hari = state.tanggalSimulasi, dibuat = [];
    if (+hari.slice(8, 10) < 8) return dibuat;
    var pid = periodeSebelum(periodeOf(hari));
    var p = cariPeriode(state, pid);
    if (!p || p.status === 'Terbit') return dibuat;
    if (state.tiket.some(function (t) { return t.jenis === 'Pengingat' && t.koperasi_id === state.koperasi.id && t.periode_id === pid; })) return dibuat;
    var t = {
      id: nomorTiketBerikut(state), koperasi_id: state.koperasi.id, periode_id: pid, jenis: 'Pengingat',
      status: 'Terbuka', dibuat: hari, tenggat: periodeOf(hari) + '-10',
      pemilik: 'PNG', pemilik_nama: 'Pengurus ' + state.koperasi.nama_pendek, salinan: [state.koperasi.pendamping_utama],
      ringkasan: 'Laporan ' + namaPeriode(pid) + ' belum terbit. ' + (p.status === 'Terbuka' ? 'Tutup buku lalu minta pengesahan pengawas' : 'Laporan menunggu pengesahan pengawas') + ' paling lambat tanggal 10.',
      penjelasan: '', catatan: []
    };
    state.tiket.push(t); dibuat.push(t);
    return dibuat;
  }

  function hitungUlang(state) {
    return state.skor.slice().sort(function (a, b) { return a.periode_id < b.periode_id ? -1 : 1; }).map(function (rec) {
      var amb = cariAmbang(state, rec.ambang_versi);
      var r = ringkasanPeriode(state, rec.periode_id, rec.asOf);
      var sk = hitungSkor(r, amb);
      return { periode_id: rec.periode_id, tersimpan: rec.nilai, statusTersimpan: rec.status, hitung: sk.nilai, statusHitung: sk.status,
        sama: sk.nilai === rec.nilai && sk.status === rec.status, ambang_versi: amb.versi };
    });
  }

  /* Pendampingan: tenggatnya kontak pertama, jadi terlambat hanya bila masih Terbuka.
   * Tindak lanjut: terlambat selama belum Selesai. */
  function terlambat(t, tanggal) {
    if (t.status === 'Selesai' || tanggal <= t.tenggat) return false;
    return t.jenis === 'Pendampingan' ? t.status === 'Terbuka' : true;
  }

  /* ---------- e-RAT ---------- */
  function paketRAT(state) {
    var terbit = state.periode.filter(function (p) { return p.status === 'Terbit'; });
    var akhir = terbit.length ? terbit[terbit.length - 1].id : null;
    if (!akhir) return null;
    var tahun = akhir.slice(0, 4) + '-01-01';
    var sampai = akhirPeriode(akhir);
    var lr = labaRugi(state.entri, tahun, sampai);
    var nr = neraca(state.entri, sampai, tahun);
    var sk = state.skor.filter(function (s) { return s.periode_id === akhir; })[0];
    return {
      koperasi: state.koperasi.nama, sampai_periode: akhir, neraca: nr, laba_rugi: lr,
      skor: sk ? { nilai: sk.nilai, status: sk.status } : null,
      usulan_shu: { anggota_persen: 70, cadangan_persen: 30, shu: lr.shu },
      agenda: state.rat.agenda.map(function (a) { return a.judul; }),
      ujung_hash_buku: state.entri.length ? state.entri[state.entri.length - 1].hash : GENESIS
    };
  }
  function terbitkanPaket(state) {
    var rat = state.rat;
    if (rat.status !== 'Dijadwalkan') return { ok: false, pesan: 'Paket sudah terbit dan terkunci.' };
    var isi = paketRAT(state);
    if (!isi) return { ok: false, pesan: 'Belum ada laporan terbit untuk dijadikan paket.' };
    var json = JSON.stringify(isi);
    rat.paket = { isi: isi, json: json, hash: sha256(json), terbit_pada: state.tanggalSimulasi,
      h_minus: diffDays(rat.tanggal, state.tanggalSimulasi) };
    rat.status = 'Paket terbit';
    return { ok: true, paket: rat.paket };
  }
  function periksaPaket(rat) {
    if (!rat.paket) return null;
    return sha256(rat.paket.json) === rat.paket.hash && JSON.stringify(rat.paket.isi) === rat.paket.json;
  }
  function kuorumRAT(state) {
    var hadir = state.rat.kehadiran.length, n = state.anggota.length;
    return { hadir: hadir, anggota: n, perlu: Math.floor(n / 2) + 1, tercapai: hadir > n / 2 };
  }
  function mulaiRAT(state) {
    var rat = state.rat;
    if (rat.status !== 'Paket terbit') return { ok: false, pesan: rat.status === 'Dijadwalkan' ? 'Terbitkan paket RAT dulu.' : 'RAT sudah dimulai.' };
    rat.status = 'Berlangsung';
    rat.dimulai_pada = state.tanggalSimulasi;
    rat.kode_hadir = String(1000 + parseInt(sha256(rat.id + state.tanggalSimulasi + rat.paket.hash).slice(0, 6), 16) % 9000);
    return { ok: true, kode: rat.kode_hadir };
  }
  /* kode = null berarti pengurus menandai hadir langsung dari daftar hadir. */
  function catatHadir(state, anggotaId, kode) {
    var rat = state.rat;
    if (rat.status !== 'Berlangsung') return { ok: false, pesan: 'Daftar hadir dibuka saat RAT berlangsung.' };
    var a = state.anggota.filter(function (x) { return x.id === anggotaId; })[0];
    if (!a) return { ok: false, pesan: 'Anggota tidak ditemukan.' };
    if (kode !== null && String(kode).trim() !== rat.kode_hadir) return { ok: false, pesan: 'Kode hadir tidak cocok. Lihat kode empat angka yang ditampilkan pengurus di tempat rapat, lalu coba lagi.' };
    if (rat.kehadiran.some(function (k) { return k.anggota_id === anggotaId; })) return { ok: true, sudah: true };
    rat.kehadiran.push({ anggota_id: anggotaId, hadir_pada: state.tanggalSimulasi });
    return { ok: true };
  }
  function kirimSuara(state, agendaId, anggotaId, pilihan) {
    var rat = state.rat;
    if (rat.status !== 'Berlangsung') return { ok: false, pesan: 'Pemungutan suara hanya saat RAT berlangsung.' };
    if (!rat.kehadiran.some(function (k) { return k.anggota_id === anggotaId; })) return { ok: false, pesan: 'Isi daftar hadir dulu. Hanya anggota yang hadir yang dapat memberi suara.' };
    if (!kuorumRAT(state).tercapai) return { ok: false, pesan: 'Kuorum belum tercapai. Suara dibuka setelah lebih dari separuh anggota hadir.' };
    if (rat.suara.some(function (s) { return s.agenda_id === agendaId && s.anggota_id === anggotaId; })) return { ok: false, pesan: 'Suara Anda untuk agenda ini sudah tercatat dan tidak dapat diubah.' };
    if (['Setuju', 'Tidak setuju', 'Abstain'].indexOf(pilihan) < 0) return { ok: false, pesan: 'Pilih salah satu: Setuju, Tidak setuju, atau Abstain.' };
    rat.suara.push({ agenda_id: agendaId, anggota_id: anggotaId, pilihan: pilihan, dikirim_pada: state.tanggalSimulasi });
    return { ok: true };
  }
  function rekapSuara(state) {
    return state.rat.agenda.map(function (a) {
      var r = { Setuju: 0, 'Tidak setuju': 0, Abstain: 0 };
      state.rat.suara.forEach(function (s) { if (s.agenda_id === a.id) r[s.pilihan]++; });
      var sah = r.Setuju + r['Tidak setuju'] + r.Abstain;
      return { id: a.id, judul: a.judul, rekap: r, total: sah, hasil: sah === 0 ? 'Tidak ada suara' : (r.Setuju > sah / 2 ? 'Diterima' : 'Tidak diterima') };
    });
  }
  function tutupRAT(state) {
    var rat = state.rat;
    if (rat.status !== 'Berlangsung') return { ok: false, pesan: 'RAT belum berlangsung.' };
    var k = kuorumRAT(state);
    rat.status = 'Selesai';
    rat.berita_acara = {
      dibuat_pada: state.tanggalSimulasi, tanggal_rat: rat.tanggal, koperasi: state.koperasi.nama,
      kuorum: k, paket_hash: rat.paket ? rat.paket.hash : null, rekap: rekapSuara(state),
      hadir: rat.kehadiran.map(function (h) { return h.anggota_id; })
    };
    rat.berita_acara.hash = sha256(JSON.stringify(rat.berita_acara));
    return { ok: true, berita_acara: rat.berita_acara };
  }

  /* ---------- Format ---------- */
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function namaPeriode(p) { return BULAN[+p.slice(5, 7) - 1] + ' ' + p.slice(0, 4); }
  function namaBulan(p) { return BULAN[+p.slice(5, 7) - 1]; }
  function fmtTgl(s) { if (!s) return '—'; return +s.slice(8, 10) + ' ' + BLN[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4); }
  function rp(n) {
    var neg = n < 0; n = Math.abs(Math.round(n));
    var s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '−Rp' : 'Rp') + s;
  }
  function fmtNilaiInd(i) {
    if (i.nilai === null || i.nilai === undefined) return i.catatan || '—';
    if (i.satuan === 'persen') return (Math.round(i.nilai * 1000) / 10).toString().replace('.', ',') + '%';
    return (Math.round(i.nilai * 100) / 100).toString().replace('.', ',');
  }

  var TK = {
    sha256: sha256, GENESIS: GENESIS, AKUN: AKUN, JENIS: JENIS, AMBANG_V1: AMBANG_V1, URUTAN_IND: URUTAN_IND,
    tgl: { addDays: addDays, addMonths: addMonths, diffDays: diffDays, periodeOf: periodeOf, akhirPeriode: akhirPeriode,
      awalPeriode: awalPeriode, periodeBerikut: periodeBerikut, periodeSebelum: periodeSebelum, addWorkingDays: addWorkingDays, minTgl: minTgl },
    hashEntri: hashEntri, periksaKeutuhan: periksaKeutuhan,
    jadwalPinjaman: jadwalPinjaman, statusPinjaman: statusPinjaman,
    saldoAkun: saldoAkun, saldoAnggota: saldoAnggota, labaRugi: labaRugi, neraca: neraca,
    ringkasanPeriode: ringkasanPeriode, hitungSkor: hitungSkor, pratinjauSkor: pratinjauSkor,
    buatBaris: buatBaris, validasi: validasi, tambahEntri: tambahEntri, cariEntri: cariEntri, sinkron: sinkron,
    cariPeriode: cariPeriode, periodeBerjalan: periodeBerjalan, ambangAktif: ambangAktif,
    tutupBuku: tutupBuku, sahkanLaporan: sahkanLaporan, periksaPengingat: periksaPengingat, hitungUlang: hitungUlang, buatTiketDariSkor: buatTiketDariSkor,
    nomorTiketBerikut: nomorTiketBerikut, terlambat: terlambat,
    paketRAT: paketRAT, terbitkanPaket: terbitkanPaket, periksaPaket: periksaPaket, kuorumRAT: kuorumRAT,
    mulaiRAT: mulaiRAT, catatHadir: catatHadir, kirimSuara: kirimSuara, rekapSuara: rekapSuara, tutupRAT: tutupRAT,
    BULAN: BULAN, namaPeriode: namaPeriode, namaBulan: namaBulan, fmtTgl: fmtTgl, rp: rp, fmtNilaiInd: fmtNilaiInd
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = TK;
  root.TK = TK;
})(typeof window !== 'undefined' ? window : globalThis);
