/* TERANG-KOP — data simulasi.
 * Kopdes Merah Putih Sukamaju (fiktif): 21 anggota, sembilan bulan buku, dibangun
 * dengan mencatat setiap transaksi lewat mesin yang sama dan menutup buku tiap bulan.
 * Ditambah 29 koperasi simulasi untuk dasbor wilayah. Semua nama dan angka fiktif. */
(function (root) {
  'use strict';
  var TK = root.TK || (typeof require !== 'undefined' ? require('./engine.js') : null);
  var T = TK.tgl;

  function prng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var TANGGAL_SIMULASI = '2026-10-16';

  var NAMA = [
    ['Budi Santoso', 'Ketua'], ['Rina Wulandari', 'Bendahara'], ['Hendra Gunawan', 'Pengawas'], ['Siti Aminah', ''],
    ['Agus Riyadi', ''], ['Dewi Kartika', ''], ['Joko Susilo', ''], ['Sri Rahayu', ''], ['Wawan Setiawan', ''],
    ['Rudi Hermawan', ''], ['Lina Marlina', ''], ['Yanto Prasetyo', ''], ['Nur Aisyah', ''], ['Bambang Irawan', ''],
    ['Eka Putri', ''], ['Fajar Nugroho', ''], ['Ratna Sari', ''], ['Dodi Kurniawan', ''], ['Maya Anggraini', ''],
    ['Iwan Kusuma', ''], ['Tuti Handayani', '']
  ];

  /* Pinjaman: [id, anggota, pokok, tenor, jasa %/bulan, tanggal cair, angsuran yang dilewati (nomor ke-)] */
  var PINJAMAN = [
    ['PJ-01', 'A01', 2000000, 10, 1.5, '2026-02-15', []],
    ['PJ-02', 'A05', 1500000, 6, 1.5, '2026-02-20', []],
    ['PJ-03', 'A06', 3000000, 12, 1.5, '2026-03-10', []],
    ['PJ-04', 'A07', 1800000, 6, 1.5, '2026-04-12', [4, 5, 6]],
    ['PJ-05', 'A08', 2400000, 12, 1.5, '2026-05-05', []],
    ['PJ-06', 'A09', 2000000, 8, 1.5, '2026-06-10', [3, 4]],
    ['PJ-07', 'A04', 1500000, 5, 1.5, '2026-06-20', []],
    ['PJ-08', 'A10', 3000000, 10, 1.5, '2026-07-08', []],
    ['PJ-09', 'A11', 1800000, 6, 1.5, '2026-08-15', []],
    ['PJ-10', 'A12', 2500000, 10, 1.5, '2026-09-05', []]
  ];

  /* Simpanan sukarela: [anggota, tanggal, nominal (negatif = penarikan)] */
  var SUKARELA = [
    ['A04', '2026-02-09', 300000], ['A04', '2026-04-08', 200000], ['A04', '2026-07-07', 300000],
    ['A01', '2026-01-20', 1000000], ['A02', '2026-02-11', 750000], ['A03', '2026-03-03', 500000],
    ['A06', '2026-02-16', 400000], ['A08', '2026-03-18', 600000], ['A13', '2026-01-28', 900000],
    ['A14', '2026-04-14', 1200000], ['A15', '2026-05-12', 350000], ['A16', '2026-03-24', 800000],
    ['A17', '2026-06-09', 450000], ['A19', '2026-02-23', 700000], ['A20', '2026-05-26', 1000000],
    ['A21', '2026-07-14', 500000], ['A13', '2026-06-17', -300000], ['A01', '2026-08-11', -400000],
    ['A14', '2026-09-08', 300000], ['A18', '2026-08-19', 250000], ['A10', '2026-03-12', 1000000], ['A16', '2026-09-15', -200000],
    ['A02', '2026-10-06', 250000], ['A21', '2026-10-09', 150000]
  ];

  /* Log pembukaan ringkasan anggota (indikator T dan K2). */
  var LOG_RINGKASAN = (function () {
    var out = [];
    var tambah = function (tgl, ids) { ids.forEach(function (n) { out.push({ anggota_id: 'A' + ('0' + n).slice(-2), tanggal: tgl }); }); };
    tambah('2026-01-08', [1, 2, 3, 4, 5, 6, 13, 14, 19]);
    tambah('2026-02-10', [1, 2, 3, 4, 8, 15, 16]);
    tambah('2026-03-09', [2, 4, 6, 11, 14, 17, 20]);
    tambah('2026-04-08', [1, 2, 3, 4, 13, 18, 19, 21]);
    tambah('2026-05-11', [2, 4, 5, 9, 12, 16]);
    tambah('2026-06-08', [1, 2, 3, 6, 14, 15, 20]);
    tambah('2026-07-08', [2, 4, 8, 17]);
    tambah('2026-08-10', [1, 2, 3, 5, 6, 13, 19]);
    tambah('2026-09-09', [2, 14, 16, 9]);
    tambah('2026-10-07', [20, 21]);
    tambah('2026-10-12', [11, 15]);
    return out;
  })();

  function koperasiDasar() {
    return {
      id: 'KOP-01', nama: 'Kopdes Merah Putih Sukamaju', nama_pendek: 'Kopdes Sukamaju', desa: 'Sukamaju',
      kecamatan: 'Cibening', kabupaten: 'Kabupaten Tanah Terang', mulai_buku: '2026-01-01',
      angsuran_bank_bulanan: 600000, pendamping_utama: 'Dimas Pratama', pendamping_cadangan: 'Ayu Lestari'
    };
  }

  function rencanaTransaksi() {
    var rnd = prng(20260116);
    var d = [];
    var cid = 0;
    var push = function (x) { cid++; x.cid = 'seed-' + ('000' + cid).slice(-4); d.push(x); };
    var anggota = NAMA.map(function (_, i) { return 'A' + ('0' + (i + 1)).slice(-2); });

    anggota.forEach(function (id, i) {
      push({ tanggal: '2026-01-' + ('0' + (5 + (i % 5))).slice(-2), jenis: 'T01', anggota_id: id, nominal: 100000, uraian: 'Simpanan pokok' });
    });
    // Simpanan wajib Rp25.000 per bulan; Oktober baru sebagian anggota yang menyetor.
    for (var m = 1; m <= 10; m++) {
      anggota.forEach(function (id, i) {
        if (m === 10 && (i % 3 === 0 || id === 'A04')) return;
        var hari = 3 + ((i * 7 + m) % 9);
        if (m === 10 && hari > 15) hari = 15;
        push({ tanggal: '2026-' + ('0' + m).slice(-2) + '-' + ('0' + hari).slice(-2), jenis: 'T02', anggota_id: id, nominal: 25000,
          uraian: 'Simpanan wajib ' + TK.namaBulan('2026-' + ('0' + m).slice(-2)) });
      });
    }
    SUKARELA.forEach(function (s) {
      push({ tanggal: s[1], jenis: s[2] > 0 ? 'T03' : 'T04', anggota_id: s[0], nominal: Math.abs(s[2]),
        uraian: s[2] > 0 ? 'Setoran sukarela' : 'Penarikan sukarela' });
    });
    // Pinjaman bank dan angsurannya.
    push({ tanggal: '2026-02-02', jenis: 'T10', nominal: 10000000, uraian: 'Pinjaman modal kerja dari bank, tenor 20 bulan' });
    for (m = 3; m <= 9; m++) push({ tanggal: '2026-' + ('0' + m).slice(-2) + '-25', jenis: 'T11', pokok: 500000, jasa: 100000, uraian: 'Angsuran bank ke-' + (m - 2) });
    // Akhir September pengurus mempercepat pelunasan utang bank dari rekening bank, sehingga kas dan bank menipis (likuiditas kuning).
    push({ tanggal: '2026-09-26', jenis: 'T11', pokok: 5500000, jasa: 0, uraian: 'Pelunasan dipercepat sebagian utang bank' });
    // Pinjaman anggota.
    PINJAMAN.forEach(function (p) {
      push({ tanggal: p[5], jenis: 'T05', anggota_id: p[1], nominal: p[2], tenor: p[3], jasa_persen: p[4], pinjaman_id_baru: p[0],
        uraian: 'Pencairan pinjaman ' + p[0] });
      var jadwal = TK.jadwalPinjaman({ id: p[0], pokok: p[2], tenor: p[3], jasa_persen: p[4], tanggal_cair: p[5] });
      jadwal.forEach(function (j) {
        if (j.jatuh_tempo > TANGGAL_SIMULASI || p[6].indexOf(j.ke) >= 0) return;
        var bayar = T.addDays(j.jatuh_tempo, -Math.floor(rnd() * 3));
        push({ tanggal: bayar, jenis: 'T06', anggota_id: p[1], pinjaman_id: p[0], pokok: j.pokok, jasa: j.jasa, uraian: 'Angsuran ' + p[0] + ' ke-' + j.ke });
      });
    });
    // Gerai: penjualan dan pembelian barang, sedikit tumbuh dari bulan ke bulan.
    for (m = 1; m <= 10; m++) {
      var akhir = m === 10 ? 16 : +T.akhirPeriode('2026-' + ('0' + m).slice(-2)).slice(8, 10);
      var omzet = 4600000 + m * 150000;
      var hariJual = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29].filter(function (x) { return x <= akhir; });
      var bobot = hariJual.map(function () { return 0.7 + rnd() * 0.6; });
      var tot = bobot.reduce(function (a, b) { return a + b; }, 0);
      var skala = m === 10 ? hariJual.length / 10 : 1;
      hariJual.forEach(function (h, k) {
        var n = Math.round(omzet * skala * bobot[k] / tot / 500) * 500;
        push({ tanggal: '2026-' + ('0' + m).slice(-2) + '-' + ('0' + h).slice(-2), jenis: 'T07', nominal: n, uraian: 'Penjualan gerai' });
      });
      var hpp = omzet * 0.82 * skala;
      (m === 1 ? [8, 12, 17, 24] : [3, 10, 17, 24]).filter(function (x) { return x <= akhir; }).forEach(function (h, k, arr) {
        var n = Math.round(hpp / (m === 10 ? 4 : arr.length) * (0.85 + rnd() * 0.3) / 1000) * 1000;
        push({ tanggal: '2026-' + ('0' + m).slice(-2) + '-' + ('0' + h).slice(-2), jenis: 'T08', nominal: n, uraian: 'Belanja barang gerai' });
      });
      push({ tanggal: '2026-' + ('0' + m).slice(-2) + '-' + (m === 10 ? '05' : '27'), jenis: 'T09', nominal: 150000, uraian: 'Listrik dan air gerai' });
      push({ tanggal: '2026-' + ('0' + m).slice(-2) + '-' + (m === 10 ? '15' : '28'), jenis: 'T09', nominal: 175000, uraian: 'Alat tulis dan transportasi' });
    }
    push({ tanggal: '2026-09-28', jenis: 'T12', nominal: 900000, uraian: 'Penyisihan untuk PJ-04 yang menunggak' });
    return d;
  }

  function hariKerjaKe(tanggalAwal, n) { return T.addWorkingDays(T.addDays(tanggalAwal, -1), n); }

  function bangunSukamaju() {
    var state = {
      versi: 4, tanggalSimulasi: '2026-01-01', koperasi: koperasiDasar(),
      anggota: NAMA.map(function (n, i) {
        var id = 'A' + ('0' + (i + 1)).slice(-2);
        return { id: id, no: 'SKM-' + ('00' + (i + 1)).slice(-3), nama: n[0], jabatan: n[1], bergabung: '2026-01-05',
          persetujuan_pdp: '2026-01-05' };
      }),
      pinjaman: [], entri: [], antrean: [], periode: [{ id: '2026-01', status: 'Terbuka' }], skor: [],
      ambang: [TK.AMBANG_V1], tiket: [], nomorTiket: 0, logRingkasan: [], audit: [],
      rat: {
        id: 'RAT-2026', tanggal: '2026-11-21', kuorum_aturan: 'Lebih dari separuh anggota', status: 'Dijadwalkan',
        agenda: [
          { id: 'AG1', judul: 'Pengesahan laporan pertanggungjawaban pengurus tahun buku 2026 (sampai September)' },
          { id: 'AG2', judul: 'Usulan pembagian SHU: 70% untuk anggota, 30% untuk cadangan' },
          { id: 'AG3', judul: 'Rencana kerja 2027: penambahan stok gerai pupuk dan gas' }
        ],
        paket: null, dibaca: {}, kehadiran: [], suara: [], berita_acara: null
      }
    };
    var rencana = rencanaTransaksi();
    rencana.forEach(function (x, i) { x._u = i; });
    rencana.sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : a._u - b._u; });
    // Jadwal tutup buku (hari kerja ke-3) dan pengesahan (hari kerja ke-5) tiap bulan, Januari sampai September.
    var peristiwa = [];
    for (var m = 1; m <= 9; m++) {
      var pid = '2026-' + ('0' + m).slice(-2);
      var awalBerikut = T.awalPeriode(T.periodeBerikut(pid));
      peristiwa.push({ tanggal: hariKerjaKe(awalBerikut, 3), jenis: 'tutup', periode: pid });
      peristiwa.push({ tanggal: hariKerjaKe(awalBerikut, 5), jenis: 'sahkan', periode: pid });
    }
    var hari = '2026-01-01';
    var iR = 0;
    var log = LOG_RINGKASAN.slice().sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; });
    var iL = 0;
    var galat = [];
    while (hari <= TANGGAL_SIMULASI) {
      state.tanggalSimulasi = hari;
      while (iL < log.length && log[iL].tanggal === hari) { state.logRingkasan.push(log[iL]); iL++; }
      while (iR < rencana.length && rencana[iR].tanggal === hari) {
        var dr = rencana[iR]; delete dr._u;
        var r = TK.tambahEntri(state, dr, dr.jenis === 'T12' ? 'PNG' : 'PNG');
        if (!r.ok) galat.push(dr.cid + ' ' + dr.jenis + ' ' + dr.tanggal + ': ' + r.galat.map(function (g) { return g.pesan; }).join('; '));
        iR++;
      }
      peristiwa.filter(function (p) { return p.tanggal === hari; }).forEach(function (p) {
        if (p.jenis === 'tutup') {
          var t = TK.tutupBuku(state, p.periode, 'PNG');
          if (!t.ok) galat.push('tutup ' + p.periode + ': ' + t.pesan);
        } else TK.sahkanLaporan(state, p.periode, 'PGW');
      });
      hari = T.addDays(hari, 1);
    }
    state.tanggalSimulasi = TANGGAL_SIMULASI;
    // Tiket lama dianggap sudah tuntas, kecuali tiket Pendampingan September yang sedang diproses.
    state.tiket.forEach(function (t) {
      if (t.periode_id === '2026-09') {
        t.status = 'Diproses';
        t.catatan.push({ oleh: 'Dimas Pratama (KJDP)', tanggal: '2026-10-07', teks: 'Kontak pertama dengan Bu Rina (bendahara). Likuiditas kuning karena pelunasan dipercepat utang bank pada 26 September, dan dua peminjam menunggak (PJ-04 dan PJ-06). Pengurus akan menagih sebelum 20 Oktober.' });
      } else {
        t.status = 'Selesai';
        t.catatan.push({ oleh: 'Sistem', tanggal: t.tenggat, teks: 'Ditutup dalam data simulasi.' });
      }
    });
    state._galatSeed = galat;
    return state;
  }

  /* ---------- 29 koperasi simulasi untuk dasbor wilayah ---------- */
  var DESA = ['Cibening', 'Mekarsari', 'Sindangjaya', 'Karangtengah', 'Sukaraja', 'Cilember', 'Pasirhalang', 'Tanjungsari',
    'Margamulya', 'Cikahuripan', 'Jayamukti', 'Nagrak', 'Ciherang', 'Bojongsari', 'Sirnagalih', 'Wangunreja', 'Sukamulya',
    'Pagerwangi', 'Cipeundeuy', 'Rancabali', 'Lembursitu', 'Gunungsari', 'Sukaresmi', 'Pasirjambu', 'Cijambe', 'Mandalawangi',
    'Kertajaya', 'Babakan', 'Situraja'];
  var KECAMATAN = ['Cibening', 'Sukaraja', 'Nagrak', 'Ciherang', 'Rancabali'];
  var PENDAMPING = [['Dimas Pratama', 'Ayu Lestari'], ['Ayu Lestari', 'Rizky Maulana'], ['Rizky Maulana', 'Putri Ramadhani'],
    ['Putri Ramadhani', 'Dimas Pratama'], ['Galih Saputra', 'Ayu Lestari']];
  var PERIODE_WIL = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];

  // Profil per koperasi: s = Sehat, w = Waspada, t = Perlu tindakan, b = baru (Dikalibrasi)
  var PROFIL = 'ssswsstswsssbwsswssstssswswss';

  function ringkasanSintetis(rnd, profil, bulanKe, bulanIdx, anggota) {
    var tingkat = profil === 's' ? 0 : profil === 'w' ? 1 : profil === 't' ? 2 : 0;
    var drift = profil === 'w' || profil === 't' ? bulanIdx / 5 : 0; // makin buruk menjelang September
    var j = function (a, b) { return a + rnd() * (b - a); };
    var beredar = Math.round(j(8, 30)) * 1000000;
    var aRasio = tingkat === 0 ? j(0, 0.05) : tingkat === 1 ? j(0.03, 0.06 + 0.06 * drift) : j(0.06, 0.08 + 0.12 * drift);
    var menunggak = Math.round(beredar * aRasio / 1000) * 1000;
    var pRasio = tingkat === 0 ? j(0.9, 1.3) : tingkat === 1 ? j(0.55, 1.1) : j(0.2, 0.7);
    var modal = Math.round(j(5, 20)) * 1000000;
    var shu = Math.round(modal * j(0.15, 0.4));
    var eRasio = tingkat === 2 ? j(1.2, 2.2 + drift) : j(0.6, 1.45);
    var pendapatan = Math.round(j(30, 120)) * 1000000 * (bulanKe / 9);
    var rRasio = tingkat === 0 ? j(0.7, 0.86) : tingkat === 1 ? j(0.84, 0.96) : j(0.9, 0.98 + 0.08 * drift);
    var sukarela = Math.round(modal * eRasio * 0.6);
    var utang = Math.round(modal * eRasio + shu * eRasio - sukarela);
    var lRasio = tingkat === 2 ? j(0.45, 1.1) : j(1.0, 2.2);
    var angsuran = Math.round(utang / 20);
    var aktif = Math.round(anggota * (tingkat === 2 ? j(0.45, 0.8) : j(0.65, 1)));
    var buka = Math.round(anggota * (tingkat === 0 ? j(0.45, 0.85) : j(0.25, 0.6)));
    return {
      bulanKe: bulanKe, penyisihan: Math.round(menunggak * pRasio), menunggak: menunggak, beredar: beredar,
      sukarela: sukarela, utangBank: Math.max(0, utang), modal: modal, shu: shu,
      pendapatan: Math.round(pendapatan), beban: Math.round(pendapatan * rRasio),
      kasBank: Math.round((sukarela + angsuran) * lRasio), angsuranBank: angsuran,
      aktif: Math.min(aktif, anggota), buka: Math.min(buka, anggota), anggota: anggota
    };
  }

  function bangunWilayah() {
    var rnd = prng(7351);
    var kop = [];
    var tiket = [];
    var no = 0;
    DESA.forEach(function (desa, i) {
      var profil = PROFIL[i];
      var anggota = 15 + Math.floor(rnd() * 26);
      var mulaiIdx = profil === 'b' ? 4 : 0; // koperasi baru mulai Agustus
      var pend = PENDAMPING[i % PENDAMPING.length];
      var bulan = [];
      PERIODE_WIL.forEach(function (pid, k) {
        if (k < mulaiIdx) return;
        var bulanKe = profil === 'b' ? k - mulaiIdx + 1 : 4 + k;
        var r = ringkasanSintetis(rnd, profil, bulanKe, k, anggota);
        r.periode = pid;
        var sk = TK.hitungSkor(r, TK.AMBANG_V1);
        var telat = rnd() < (profil === 't' ? 0.35 : profil === 'w' ? 0.15 : 0.04);
        var tglTerbit = T.addDays(T.awalPeriode(T.periodeBerikut(pid)), telat ? 10 + Math.floor(rnd() * 8) : 4 + Math.floor(rnd() * 5));
        bulan.push({ periode: pid, ringkasan: r, nilai: sk.nilai, status: sk.status, terbit_pada: tglTerbit, ambang_versi: 'v1.0' });
      });
      var akhir = bulan[bulan.length - 1];
      var bukaKuartal = Math.round(anggota * (profil === 's' ? 0.55 + rnd() * 0.35 : 0.3 + rnd() * 0.35));
      var ratTanggal = T.addDays('2026-11-07', Math.floor(rnd() * 35));
      var ratStatus = profil === 'b' ? 'Belum dijadwalkan' : (T.diffDays(ratTanggal, TANGGAL_SIMULASI) < 30 && rnd() < 0.7 ? 'Paket terbit' : 'Dijadwalkan');
      var item = {
        id: 'KOP-' + ('0' + (i + 2)).slice(-2), nama: 'Kopdes Merah Putih ' + desa, desa: desa,
        kecamatan: KECAMATAN[i % KECAMATAN.length], anggota: anggota, pendamping_utama: pend[0], pendamping_cadangan: pend[1],
        bulan: bulan, bukaKuartal: bukaKuartal, rat: { tanggal: profil === 'b' ? null : ratTanggal, status: ratStatus,
          paket_h: ratStatus === 'Paket terbit' ? 7 + Math.floor(rnd() * 6) : null },
        sintetis: true
      };
      kop.push(item);
      // Tiket dari status bulan terakhir (September), dibuat saat tutup buku awal Oktober.
      if (akhir.status === 'Waspada' || akhir.status === 'Perlu tindakan') {
        no++;
        var dibuat = '2026-10-0' + (2 + Math.floor(rnd() * 4));
        var tl = akhir.status === 'Perlu tindakan';
        var stOps = tl ? ['Terbuka', 'Diproses', 'Menunggu verifikasi'] : ['Terbuka', 'Diproses', 'Selesai'];
        var st = stOps[Math.floor(rnd() * stOps.length)];
        var tenggat = tl ? T.addDays(dibuat, 14) : T.addWorkingDays(dibuat, 7);
        tiket.push({
          id: 'TK-' + ('00' + no).slice(-3), koperasi_id: item.id, periode_id: '2026-09', jenis: tl ? 'Tindak lanjut' : 'Pendampingan',
          status: st, dibuat: dibuat, tenggat: tenggat, pemilik: tl ? 'PNG' : 'KJD',
          pemilik_nama: tl ? 'Pengurus Kopdes ' + desa : pend[0], salinan: tl ? ['Pengawas', 'Dinas Koperasi', pend[0]] : [pend[1]],
          ringkasan: 'Skor September ' + akhir.nilai + ', ' + akhir.status + '.', penjelasan: st === 'Menunggu verifikasi' ? 'Penjelasan tertulis sudah dibagikan di pertemuan anggota.' : '',
          catatan: st === 'Terbuka' ? [] : [{ oleh: tl ? 'Pengurus' : pend[0] + ' (KJDP)', tanggal: T.addDays(dibuat, 3), teks: tl ? 'Rencana penagihan dan penghematan beban disusun.' : 'Kontak pertama dengan pengurus.' }]
        });
      }
      // Tiket lama yang sudah selesai, agar riwayat K4 punya isi.
      if (rnd() < 0.3) {
        no++;
        var d0 = '2026-0' + (6 + Math.floor(rnd() * 3)) + '-04';
        tiket.push({
          id: 'TK-' + ('00' + no).slice(-3), koperasi_id: item.id, periode_id: T.periodeSebelum(d0.slice(0, 7)), jenis: 'Tindak lanjut',
          status: 'Selesai', dibuat: d0, tenggat: T.addDays(d0, 14), selesai_pada: T.addDays(d0, 6 + Math.floor(rnd() * 12)),
          pemilik: 'PNG', pemilik_nama: 'Pengurus Kopdes ' + desa, salinan: ['Pengawas', 'Dinas Koperasi', pend[0]],
          ringkasan: 'Tindak lanjut bulan ' + TK.namaPeriode(T.periodeSebelum(d0.slice(0, 7))) + '.', penjelasan: 'Penjelasan tertulis dibagikan.',
          catatan: [{ oleh: 'Pengawas', tanggal: T.addDays(d0, 10), teks: 'Diverifikasi.' }]
        });
      }
    });
    tiket.sort(function (a, b) { return a.dibuat < b.dibuat ? -1 : 1; });
    tiket.forEach(function (t, k) { t.id = 'TK-' + ('00' + (k + 1)).slice(-3); });
    return { koperasi: kop, tiket: tiket };
  }

  function stateAwal() {
    var wil = bangunWilayah();
    var s = bangunSukamaju();
    // Gabungkan penomoran tiket: tiket wilayah lebih dulu, lalu tiket Sukamaju.
    var n = wil.tiket.length;
    s.tiket.forEach(function (t) { n++; t.id = 'TK-' + ('00' + n).slice(-3); });
    s.nomorTiket = n;
    s.tiket = wil.tiket.concat(s.tiket);
    s.k5 = { pemuda_berupah_umk: 9, target: 15, diisi_oleh: 'Koordinator KJDP', tanggal: '2026-10-01' };
    return s;
  }

  var SEED = { stateAwal: stateAwal, bangunWilayah: bangunWilayah, TANGGAL_SIMULASI: TANGGAL_SIMULASI, PERIODE_WIL: PERIODE_WIL };
  if (typeof module !== 'undefined' && module.exports) module.exports = SEED;
  root.SEED = SEED;
})(typeof window !== 'undefined' ? window : globalThis);
