/* TERANG-KOP — layar Pendamping KJDP dan Dinas Koperasi. */
(function () {
  'use strict';
  var App = window.App, TK = window.TK, esc = App.esc, icon = App.icon, tgl = App.tgl;

  function ringkasKop(k) {
    var akhir = k.bulan[k.bulan.length - 1];
    var tiket = App.tiketTerbuka(k.id);
    return {
      k: k, akhir: akhir, tren: k.bulan.map(function (b) { return b.nilai; }),
      patuh: k.bulan.filter(App.tepatWaktu).length, total: k.bulan.length,
      tiket: tiket, telat: tiket.filter(App.terlambat).length
    };
  }
  function kesiapanRAT(k) {
    if (!k.rat.tanggal) return '<span class="small mute">Belum dijadwalkan</span>';
    var h = TK.tgl.diffDays(k.rat.tanggal, App.today());
    if (k.rat.status === 'Selesai') return App.chip('Selesai', '', 'check');
    if (k.rat.paket_h) return App.chip('Paket H-' + k.rat.paket_h, k.rat.paket_h >= 7 ? '' : 'late', 'check');
    if (h < 7) return App.chip('Paket terlambat', 'late', 'clock');
    return '<span class="small body">' + tgl(k.rat.tanggal) + ' · paket ≤ ' + tgl(TK.tgl.addDays(k.rat.tanggal, -7)) + '</span>';
  }
  function tabelKop(rows, layar) {
    return '<div class="table-wrap"><table class="t stackable"><caption class="sr-only">Daftar koperasi</caption><thead><tr><th scope="col">Koperasi</th><th scope="col">Status</th><th scope="col" class="r">Skor</th><th scope="col">Tren 6 bulan</th><th scope="col">Laporan tepat waktu</th><th scope="col">RAT</th><th scope="col">Tiket terbuka</th></tr></thead><tbody>' +
      rows.map(function (x) {
        return '<tr class="click' + (x.telat ? ' flag' : '') + '" data-act="buka-kop" data-layar="' + layar + '" data-id="' + x.k.id + '"><td><a class="strong" href="' + App.href(layar, x.k.id) + '">' + esc(x.k.nama.replace('Kopdes Merah Putih ', 'Kopdes ')) + '</a><div class="xs mute">' + esc(x.k.kecamatan) + ' · ' + x.k.anggota + ' anggota' + (x.k.sintetis ? '' : ' · buku besar') + '</div></td>' +
          '<td>' + App.statusBadge(x.akhir.status) + '</td><td class="r strong">' + x.akhir.nilai + '</td><td data-hide-m>' + App.spark(x.tren) + '</td>' +
          '<td data-hide-m><span class="' + (x.patuh >= Math.min(5, x.total) ? '' : 'ind merah') + '">' + x.patuh + ' dari ' + x.total + '</span></td><td data-hide-m>' + kesiapanRAT(x.k) + '</td>' +
          '<td>' + (x.tiket.length ? x.tiket.length + (x.telat ? ' ' + App.chip(x.telat + ' terlambat', 'late', 'clock') : '') : '<span class="mute">0</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  App.acts['buka-kop'] = function (el, e) { if (e.target.closest('a')) return; App.go(el.getAttribute('data-layar'), el.getAttribute('data-id')); };

  /* ================= Pendamping KJDP ================= */
  var SAYA = function () { return App.ORANG.KJD.nama; };
  App.views['kjd/asuhan'] = {
    title: 'Koperasi asuhan',
    render: function (r) {
      if (r.arg) return App.ui.detailKoperasi(r.arg, 'asuhan', 'Koperasi asuhan');
      var rows = App.wilayah().filter(function (k) { return k.pendamping_utama === SAYA() || k.pendamping_cadangan === SAYA(); }).map(ringkasKop);
      var utama = rows.filter(function (x) { return x.k.pendamping_utama === SAYA(); }), cad = rows.filter(function (x) { return x.k.pendamping_utama !== SAYA(); });
      var perhatian = rows.filter(function (x) { return x.akhir.status === 'Waspada' || x.akhir.status === 'Perlu tindakan'; }).length;
      return App.pageHead('Koperasi asuhan', 'Anda pendamping utama untuk ' + utama.length + ' koperasi dan cadangan untuk ' + cad.length + '. ' + perhatian + ' koperasi berstatus Waspada atau Perlu tindakan.') +
        '<div class="stack lg"><section class="card"><h2 style="margin-bottom:12px">Pendamping utama</h2>' + tabelKop(utama, 'asuhan') + '</section>' +
        (cad.length ? '<section class="card"><h2 style="margin-bottom:4px">Pendamping cadangan</h2><p class="small mute" style="margin-bottom:12px">Anda menerima salinan tiket koperasi ini. Koordinator KJDP dapat menugaskan Anda sebagai utama.</p>' + tabelKop(cad, 'asuhan') + '</section>' : '') + '</div>';
    }
  };
  App.views['kjd/tiket'] = {
    title: 'Tiket',
    render: function (r) {
      if (r.arg) return App.ui.detailTiket(r.arg, 'tiket', 'Tiket');
      var nama = SAYA();
      var list = App.state.tiket.filter(function (t) { return t.pemilik_nama === nama || (t.salinan || []).indexOf(nama) >= 0; }).slice().reverse();
      var milik = list.filter(function (t) { return t.pemilik_nama === nama && t.status !== 'Selesai'; });
      var salinan = list.filter(function (t) { return t.pemilik_nama !== nama && t.status !== 'Selesai'; });
      var selesai = list.filter(function (t) { return t.status === 'Selesai'; });
      return App.pageHead('Tiket', 'Status Waspada membuat tiket Pendampingan untuk Anda; kontak pertama dengan pengurus dalam 7 hari kerja.') +
        '<div class="stack lg"><section class="card"><h2 style="margin-bottom:12px">Tugas Anda</h2>' + App.ui.daftarTiket(milik, 'tiket', App.empty('ticket', 'Tidak ada tiket untuk Anda', 'Tiket Pendampingan dibuat otomatis saat koperasi asuhan berstatus Waspada.')) + '</section>' +
        '<section class="card"><h2 style="margin-bottom:12px">Salinan</h2>' + App.ui.daftarTiket(salinan, 'tiket', App.empty('ticket', 'Tidak ada salinan', 'Salinan tiket Tindak lanjut koperasi asuhan muncul di sini.')) + '</section>' +
        '<section class="card"><h2 style="margin-bottom:12px">Selesai</h2>' + App.ui.daftarTiket(selesai, 'tiket') + '</section></div>';
    }
  };

  /* ================= Dinas: wilayah ================= */
  var FILTER = ['Semua', 'Sehat', 'Waspada', 'Perlu tindakan', 'Dikalibrasi'];
  App.views['din/wilayah'] = {
    title: 'Wilayah',
    render: function (r) {
      if (r.arg) return App.ui.detailKoperasi(r.arg, 'wilayah', 'Wilayah');
      var f = (r.q && r.q.s) || 'Semua';
      var semua = App.wilayah().map(ringkasKop);
      var hitung = {}; semua.forEach(function (x) { hitung[x.akhir.status] = (hitung[x.akhir.status] || 0) + 1; });
      var rows = semua.filter(function (x) { return f === 'Semua' || x.akhir.status === f; });
      var urut = { 'Perlu tindakan': 0, 'Waspada': 1, 'Dikalibrasi': 2, 'Sehat': 3 };
      rows.sort(function (a, b) { return (b.telat - a.telat) || (urut[a.akhir.status] - urut[b.akhir.status]) || (a.akhir.nilai - b.akhir.nilai); });
      var telat = semua.reduce(function (n, x) { return n + x.telat; }, 0);
      var seg = '<div class="row" role="group" aria-label="Saring menurut status">' + FILTER.map(function (s) {
        var n = s === 'Semua' ? semua.length : (hitung[s] || 0);
        return '<a class="btn sm ' + (f === s ? 'dark' : 'secondary') + '" href="' + App.href('wilayah') + '?s=' + encodeURIComponent(s) + '"' + (f === s ? ' aria-current="true"' : '') + '>' + s + ' <span class="num">' + n + '</span></a>';
      }).join('') + '</div>';
      return App.pageHead('Wilayah ' + App.state.koperasi.kabupaten.replace('Kabupaten ', 'Kab. '), semua.length + ' koperasi. Status terakhir dari laporan bulanan; baris merah punya tiket yang lewat tenggat.',
        '<a class="btn outline" href="' + App.href('ekspor') + '">' + icon('download') + 'Ekspor data</a>') +
        '<div class="stack lg">' + (telat ? App.callout('bad', 'clock', '<p><b>' + telat + ' tiket terlambat</b> di wilayah. Tiket tetap harus ditutup oleh penerimanya.</p>') : '') +
        '<section class="card"><div style="margin-bottom:12px">' + seg + '</div><p class="small mute" style="margin-bottom:8px" aria-live="polite">Menampilkan ' + rows.length + ' koperasi.</p>' +
        (rows.length ? tabelKop(rows, 'wilayah') : App.empty('map', 'Tidak ada koperasi berstatus ' + esc(f), 'Pilih status lain untuk melihat daftar.', '<a class="btn secondary" href="' + App.href('wilayah') + '">Tampilkan semua</a>')) + '</section></div>';
    }
  };
  function dataEkspor() {
    return App.wilayah().map(ringkasKop).map(function (x) {
      return { id: x.k.id, nama: x.k.nama, kecamatan: x.k.kecamatan, anggota: x.k.anggota, periode: x.akhir.periode, skor: x.akhir.nilai, status: x.akhir.status,
        ambang: x.akhir.ambang_versi, tren: x.tren.join('|'), laporan_tepat_waktu: x.patuh + '/' + x.total, rat: x.k.rat.tanggal || '', tiket_terbuka: x.tiket.length, tiket_terlambat: x.telat };
    });
  }
  function keCSV(d) {
    if (!d.length) return '';
    var kol = Object.keys(d[0]);
    var q = function (v) { v = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return [kol.join(',')].concat(d.map(function (r) { return kol.map(function (k) { return q(r[k]); }).join(','); })).join('\n');
  }
  App.keCSV = keCSV;

  /* ================= Dinas: ekspor ================= */
  var SET = {
    wilayah: { judul: 'Ringkasan wilayah', isi: 'Satu baris per koperasi: status dan skor terakhir, tren, kepatuhan laporan, RAT, dan tiket.', data: dataEkspor },
    skor: { judul: 'Skor bulanan', isi: 'Satu baris per koperasi per bulan, dengan versi ambang yang dipakai sehingga dapat dihitung ulang.', data: function () {
      var out = [];
      App.wilayah().forEach(function (k) { k.bulan.forEach(function (b) { out.push({ koperasi_id: k.id, koperasi: k.nama, periode: b.periode, skor: b.nilai, status: b.status, ambang: b.ambang_versi, terbit_pada: b.terbit_pada || '', tepat_waktu: App.tepatWaktu(b) ? 'ya' : 'tidak' }); }); });
      return out;
    } },
    tiket: { judul: 'Tiket pendampingan dan tindak lanjut', isi: 'Semua tiket di wilayah dengan tenggat, status, dan penanda Terlambat (dasar K4).', data: function () {
      return App.state.tiket.map(function (t) { return { id: t.id, koperasi_id: t.koperasi_id, periode: t.periode_id, jenis: t.jenis, status: t.status, terlambat: App.terlambat(t) ? 'ya' : 'tidak', dibuat: t.dibuat, tenggat: t.tenggat, selesai_pada: t.selesai_pada || '', penerima: t.pemilik_nama }; });
    } },
    buku: { judul: 'Buku besar Kopdes Sukamaju', isi: 'Seluruh entri dengan jurnal dan sidik jari SHA-256, untuk pemeriksaan keutuhan di luar sistem.', data: function () {
      return App.state.entri.map(function (e) {
        return { id: e.id, seq: e.seq, tanggal: e.tanggal, jenis: e.jenis, uraian: e.uraian, anggota_id: e.anggota_id || '', nominal: App.ui.nominalEntri(e),
          jurnal: e.baris.map(function (b) { return b.akun + ':' + (b.debit ? 'D' + b.debit : 'K' + b.kredit); }).join(' '), prev_hash: e.prev_hash, hash: e.hash };
      });
    } }
  };
  App.views['din/ekspor'] = {
    title: 'Ekspor',
    render: function () {
      var blok = Object.keys(SET).map(function (k) {
        var d = SET[k].data();
        return '<section class="card stack sm" aria-labelledby="ex-' + k + '"><div class="row between"><h2 id="ex-' + k + '">' + esc(SET[k].judul) + '</h2><span class="small body num">' + d.length + ' baris</span></div>' +
          '<p class="body">' + esc(SET[k].isi) + '</p><div class="row"><button class="btn primary sm" data-act="ekspor" data-set="' + k + '" data-f="csv">' + icon('download') + 'Unduh CSV</button>' +
          '<button class="btn outline sm" data-act="ekspor" data-set="' + k + '" data-f="json">' + icon('download') + 'Unduh JSON</button>' +
          '<button class="btn ghost sm" data-act="ekspor-salin" data-set="' + k + '">' + icon('copy') + 'Salin CSV</button></div></section>';
      }).join('');
      return App.pageHead('Ekspor data', 'Data wilayah dalam CSV dan JSON. Integrasi langsung dengan Simkopdes, bank, atau OJK menunggu persetujuan Kementerian Koperasi; sampai saat itu dinas memakai berkas ini.') +
        '<div class="stack lg">' + blok + App.callout('info', 'info', '<p>Berkas berisi data simulasi prototipe. Buku besar hanya memuat nomor anggota internal, tanpa nama dan tanpa nomor ponsel.</p>') + '</div>';
    }
  };
  App.acts.ekspor = function (el) {
    var k = el.getAttribute('data-set'), f = el.getAttribute('data-f'), d = SET[k].data();
    var nama = 'terangkop-' + k + '-' + App.today() + '.' + f;
    App.unduh(nama, f === 'csv' ? keCSV(d) : JSON.stringify(d, null, 2), f === 'csv' ? 'text/csv;charset=utf-8' : 'application/json');
    App.toast(nama + ' dibuat (' + d.length + ' baris).');
  };
  App.acts['ekspor-salin'] = function (el) { var k = el.getAttribute('data-set'); App.salin(keCSV(SET[k].data()), 'CSV ' + SET[k].judul.toLowerCase()); };
  App.views['din/tiketdin'] = { title: 'Tiket', nav: 'wilayah', render: function (r) { return App.ui.detailTiket(r.arg, 'wilayah', 'Wilayah'); } };

  /* ================= Dinas: papan KPI ================= */
  App.hitungKPI = function () {
    var kop = App.wilayah(), s = App.state, hari = App.today();
    var k1Lulus = kop.filter(function (k) { var n = k.bulan.filter(App.tepatWaktu).length; return n >= Math.min(5, k.bulan.length) && k.bulan.length >= 1; }).length;
    var anggota = 0, buka = 0; kop.forEach(function (k) { anggota += k.anggota; buka += k.bukaKuartal; });
    var ratSudah = kop.filter(function (k) { return k.rat.paket_h; }), ratLewat = kop.filter(function (k) { return k.rat.tanggal && TK.tgl.addDays(k.rat.tanggal, -7) < hari; });
    var ratTepat = ratLewat.filter(function (k) { return k.rat.paket_h && k.rat.paket_h >= 7; });
    var tl = s.tiket.filter(function (t) { return t.jenis === 'Tindak lanjut'; });
    var diukur = tl.filter(function (t) { return t.status === 'Selesai' || hari > t.tenggat; });
    var tepat = diukur.filter(function (t) { return t.status === 'Selesai' && (t.selesai_pada || t.tenggat) <= t.tenggat; });
    return {
      K1: { nilai: k1Lulus, target: 27, dari: kop.length },
      K2: { nilai: anggota ? buka / anggota : 0, target: 0.6, buka: buka, anggota: anggota },
      K3: { lewat: ratLewat.length, tepat: ratTepat.length, terbitAwal: ratSudah.length, target: 0.9, dari: kop.length },
      K4: { diukur: diukur.length, tepat: tepat.length, berjalan: tl.length - diukur.length, target: 1 },
      K5: s.k5
    };
  };
  App.views['din/kpi'] = {
    title: 'Papan KPI',
    render: function () {
      var K = App.hitungKPI();
      var kartu = function (kode, judul, nilaiHtml, persen, targetTxt, catatan, ok) {
        return '<section class="card stack sm" aria-labelledby="h-' + kode + '"><div class="row between"><span class="chip">' + kode + '</span>' + (ok === null ? App.chip('Belum dapat diukur', '', 'clock') : ok ? '<span class="status sehat">' + icon('checkCircle', 'sm') + 'Mencapai target</span>' : '<span class="status waspada">' + icon('alert', 'sm') + 'Di bawah target</span>') + '</div>' +
          '<h2 id="h-' + kode + '">' + judul + '</h2><p class="big">' + nilaiHtml + '</p>' +
          (persen !== null ? '<div class="bar" style="height:10px" role="img" aria-label="' + Math.round(persen * 100) + ' persen dari target"><i style="width:' + Math.min(100, Math.round(persen * 100)) + '%"></i></div>' : '') +
          '<p class="small body"><b>Target:</b> ' + targetTxt + '</p><p class="small mute">' + catatan + '</p></section>';
      };
      return App.pageHead('Papan KPI pilot', 'Lima indikator keberhasilan yang sama dengan esai. Angka di papan ini berasal dari data simulasi dan tidak boleh dibaca sebagai hasil lapangan.') +
        '<div class="stack lg">' + App.callout('info', 'info', '<p>Prototipe memakai jendela data enam bulan (April sampai September 2026), jadi target K1 diskalakan dari 10 dari 12 bulan menjadi 5 dari 6 bulan.</p>') +
        '<div class="grid g2">' +
        kartu('K1', 'Laporan bulanan tepat waktu', K.K1.nilai + '<span class="mid mute"> / ' + K.K1.dari + '</span>', K.K1.nilai / K.K1.target, 'sekurang-kurangnya 27 dari 30 Kopdes menerbitkan laporan paling lambat tanggal 10 selama 5 dari 6 bulan', 'Sumber: tanggal pengesahan laporan oleh pengawas.', K.K1.nilai >= K.K1.target) +
        kartu('K2', 'Anggota membuka ringkasan', App.persen(K.K2.nilai), K.K2.nilai / K.K2.target, 'sekurang-kurangnya 60% anggota terdaftar membuka ringkasan sekali per kuartal', K.K2.buka + ' dari ' + K.K2.anggota + ' anggota dalam 90 hari terakhir. Sumber: log pembukaan ringkasan (sama dengan indikator T).', K.K2.nilai >= K.K2.target) +
        kartu('K3', 'RAT dengan paket H-7', K.K3.lewat ? App.persen(K.K3.tepat / K.K3.lewat) : '—', K.K3.lewat ? K.K3.tepat / K.K3.lewat / K.K3.target : null, 'sekurang-kurangnya 90% Kopdes menggelar RAT dengan laporan dibagikan tujuh hari sebelumnya',
          (K.K3.lewat ? K.K3.tepat + ' dari ' + K.K3.lewat + ' koperasi yang tenggat paketnya sudah lewat. ' : 'Belum ada koperasi yang tenggat paket RAT-nya lewat. ') + K.K3.terbitAwal + ' paket sudah terbit lebih awal. Sumber: tanggal paket terhadap tanggal RAT.', K.K3.lewat ? K.K3.tepat / K.K3.lewat >= K.K3.target : null) +
        kartu('K4', 'Tindak lanjut dalam 14 hari', K.K4.diukur ? App.persen(K.K4.tepat / K.K4.diukur) : '—', K.K4.diukur ? K.K4.tepat / K.K4.diukur : null, 'seluruh status Perlu tindakan ditindaklanjuti dalam 14 hari',
          K.K4.tepat + ' dari ' + K.K4.diukur + ' tiket yang sudah selesai atau lewat tenggat; ' + K.K4.berjalan + ' masih berjalan. Sumber: tiket Tindak lanjut dan tanda Terlambat.', K.K4.diukur ? K.K4.tepat === K.K4.diukur : null) +
        kartu('K5', 'Pemuda bekerja di KJDP', K.K5.pemuda_berupah_umk + '<span class="mid mute"> / ' + K.K5.target + '</span>', K.K5.pemuda_berupah_umk / K.K5.target, '15 pemuda berupah sesuai UMK kabupaten pada akhir bulan ke-12', 'Isian manual ' + esc(K.K5.diisi_oleh) + ', ' + tgl(K.K5.tanggal) + '. Tidak berasal dari buku besar.', K.K5.pemuda_berupah_umk >= K.K5.target) +
        '</div></div>';
    }
  };

  /* ================= Dinas: ambang ================= */
  App.views['din/ambang'] = {
    title: 'Ambang',
    render: function () {
      var s = App.state, amb = TK.ambangAktif(s);
      var rows = TK.URUTAN_IND.map(function (k) {
        var d = amb.isi[k];
        return '<tr><td><span class="ind-code">' + k + '</span></td><td><b>' + esc(d.nama) + '</b><div class="xs mute">' + esc(d.rumus) + '</div></td><td class="small">' + App.ui.batas(d, 'hijau') + '</td><td class="small">' + App.ui.batas(d, 'kuning') + '</td><td class="small">' + App.ui.batas(d, 'merah') + '</td><td class="r strong">' + d.bobot + '</td></tr>';
      }).join('');
      return App.pageHead('Ambang indikator', 'Ambang awal simulasi yang disetujui dinas, bukan angka resmi PEARLS atau pemerintah.', '<button class="btn outline" data-act="salin-ambang">' + icon('copy') + 'Salin CSV</button>') +
        '<div class="stack lg"><section class="card"><div class="card-head"><h2>Versi ' + esc(amb.versi) + '</h2><span class="small body">Disetujui ' + esc(amb.disetujui_oleh) + ' · ' + App.tglPanjang(amb.tanggal) + '</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th></th><th>Indikator dan rumus</th><th>Hijau (100)</th><th>Kuning (60)</th><th>Merah (20)</th><th class="r">Bobot</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr><td></td><td colspan="4"><b>Jumlah bobot</b></td><td class="r strong">100</td></tr></tfoot></table></div></section>' +
        '<section class="card"><h2 style="margin-bottom:8px">Aturan status</h2><ul class="stack sm body" style="padding-left:20px;margin:0"><li>Skor 80 ke atas Sehat; 55 sampai 79 Waspada; di bawah 55 Perlu tindakan.</li><li>Bila likuiditas (L) merah, status minimal Waspada.</li><li>Bila dua indikator atau lebih merah, status Perlu tindakan.</li><li>Tiga bulan buku pertama berstatus Dikalibrasi.</li></ul></section>' +
        App.callout('info', 'lock', '<p>Prototipe hanya menampilkan ambang. Di produk sesungguhnya perubahan ambang membuat versi baru yang butuh persetujuan dinas yang tercatat; skor lama tetap dihitung ulang dengan versi yang dipakai saat itu.</p>') + '</div>';
    }
  };
  App.acts['salin-ambang'] = function () {
    var amb = TK.ambangAktif(App.state);
    var lines = ['kode,indikator,rumus,arah,hijau,kuning,bobot,versi'].concat(TK.URUTAN_IND.map(function (k) { var d = amb.isi[k]; return [k, d.nama, '"' + d.rumus + '"', d.arah, d.hijau, d.kuning, d.bobot, amb.versi].join(','); }));
    App.salin(lines.join('\n'), 'CSV ambang');
  };
})();
