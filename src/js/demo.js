/* TERANG-KOP — panel demo dan pemuatan awal. */
(function () {
  'use strict';
  var App = window.App, TK = window.TK, esc = App.esc, icon = App.icon;

  function masukSebagai(peran, layar, arg) {
    App.session = { peran: peran, anggota_id: peran === 'ANG' ? 'A04' : null };
    App.saveSession();
    App.closeSheet();
    var P = App.PERAN[peran];
    location.hash = '#/' + P.kode + '/' + (layar || P.nav[0][0]) + (arg ? '/' + arg : '');
    App.render();
  }
  App.masukSebagai = masukSebagai;

  App.acts.demo = function () {
    var s = App.state;
    var tamper = s._tamper;
    var btn = function (act, ic, txt, attrs, cls) { return '<button class="u-start btn ' + (cls || 'outline') + ' sm block" data-act="' + act + '" ' + (attrs || '') + '>' + icon(ic) + txt + '</button>'; };
    var peran = ['ANG', 'PNG', 'PGW', 'KJD', 'DIN'].map(function (k) {
      return '<button class="btn ' + (App.session && App.session.peran === k ? 'dark' : 'secondary') + ' sm" data-act="demo-peran" data-p="' + k + '">' + App.PERAN[k].nama.replace(' KJDP', '').replace(' Koperasi', '') + '</button>';
    }).join('');
    App.sheet('Panel demo', '<p class="body">Alat bantu demonstrasi. Tidak ada di produk sesungguhnya.</p>' +
      '<section class="stack sm"><h3>Masuk sebagai</h3><div class="u-gap-2 row">' + peran + '</div></section>' +
      '<section class="stack sm"><h3>Tanggal dan koneksi</h3><p class="small body">Tanggal simulasi ' + App.tglPanjang(s.tanggalSimulasi) + ' · ' + (s.online ? 'Daring' : 'Luring') + '</p>' +
      '<div class="u-gap-2 row"><button class="btn secondary sm" data-act="demo-hari" data-n="1">+1 hari</button><button class="btn secondary sm" data-act="demo-hari" data-n="7">+7 hari</button><button class="btn secondary sm" data-act="demo-hari" data-n="15">+15 hari</button><button class="btn secondary sm" data-act="koneksi">' + icon(s.online ? 'wifiOff' : 'wifi') + (s.online ? 'Jadikan luring' : 'Jadikan daring') + '</button></div></section>' +
      '<section class="stack sm"><h3>1. Pemulihan</h3><p class="small body">Lihat status Waspada di beranda anggota, lalu catat angsuran PJ-04 dan PJ-06 sebagai pengurus (bisa luring).</p>' +
      btn('demo-go', 'home', 'Beranda anggota (Siti Aminah)', 'data-p="ANG" data-l="beranda"') + btn('demo-go', 'plus', 'Catat angsuran PJ-04', 'data-p="PNG" data-l="catat" data-q="?j=T06&p=PJ-04"') +
      btn('demo-go', 'plus', 'Catat angsuran PJ-06', 'data-p="PNG" data-l="catat" data-q="?j=T06&p=PJ-06"') + btn('demo-go', 'lock', 'Pratinjau dan tutup buku Oktober', 'data-p="PNG" data-l="tutup"') + btn('demo-go', 'fileCheck', 'Pengawas: tinjau dan sahkan', 'data-p="PGW" data-l="tinjau"') + '</section>' +
      '<section class="stack sm"><h3>2. RAT</h3>' + btn('demo-go', 'vote', 'Pengurus: kelola RAT', 'data-p="PNG" data-l="rat"') + btn('demo-go', 'vote', 'Anggota: baca paket, hadir, beri suara', 'data-p="ANG" data-l="rat"') +
      btn('demo-hadir', 'users', 'Isi kehadiran dan suara 12 anggota lain', s.rat.status === 'Berlangsung' ? '' : 'disabled') + (s.rat.status !== 'Berlangsung' ? '<p class="xs mute">Aktif setelah pengurus memulai RAT.</p>' : '') + '</section>' +
      '<section class="stack sm"><h3>3. Dinas</h3>' + btn('demo-go', 'map', 'Wilayah 30 koperasi', 'data-p="DIN" data-l="wilayah"') + btn('demo-go', 'chart', 'Papan KPI', 'data-p="DIN" data-l="kpi"') + btn('demo-go', 'refresh', 'Detail Sukamaju dan Hitung ulang', 'data-p="DIN" data-l="wilayah" data-a="KOP-01"') + '</section>' +
      '<section class="stack sm"><h3>4. Perlu tindakan</h3><p class="small body">Pengurus mencatat penarikan sukarela besar dan beban besar, lalu tutup buku Oktober.</p>' + btn('demo-krisis', 'alert', 'Catat penarikan Rp1.500.000 dan beban Rp12.000.000') + '</section>' +
      '<section class="stack sm"><h3>5. Keutuhan</h3>' + (tamper ? '<p class="small body">Entri ' + esc(tamper.id) + ' sudah diubah diam-diam.</p>' + btn('demo-pulih', 'undo', 'Pulihkan rantai', '', 'primary') : btn('demo-ubah', 'edit', 'Ubah data entri E0269 diam-diam')) + btn('demo-go', 'link', 'Buka buku besar untuk Periksa keutuhan', 'data-p="PGW" data-l="buku"') + '</section>' +
      '<section class="stack sm"><h3>Lainnya</h3>' + btn('demo-ulang', 'refresh', 'Kirim ulang entri terakhir yang tersinkron (uji idempoten)', (s._terkirim && s._terkirim.length) ? '' : 'disabled') +
      btn('demo-reset', 'x', 'Atur ulang semua data simulasi', '', 'danger') + '</section>');
  };
  App.acts['demo-peran'] = function (el) { masukSebagai(el.getAttribute('data-p')); };
  App.acts['demo-go'] = function (el) {
    var p = el.getAttribute('data-p'), l = el.getAttribute('data-l'), a = el.getAttribute('data-a'), q = el.getAttribute('data-q') || '';
    App.session = { peran: p, anggota_id: p === 'ANG' ? 'A04' : null }; App.saveSession(); App.closeSheet();
    App._catat = null;
    location.hash = '#/' + App.PERAN[p].kode + '/' + l + (a ? '/' + a : '') + q;
    App.render();
  };
  App.acts['demo-hari'] = function (el) {
    var n = +el.getAttribute('data-n');
    App.state.tanggalSimulasi = TK.tgl.addDays(App.state.tanggalSimulasi, n);
    var baru = TK.periksaPengingat(App.state); App.save();
    App.closeSheet(); App.render();
    App.toast('Tanggal simulasi sekarang ' + App.tglPanjang(App.state.tanggalSimulasi) + '.' + (baru.length ? ' Tiket Pengingat ' + baru[0].id + ' dibuat: laporan ' + TK.namaPeriode(baru[0].periode_id) + ' belum terbit.' : ''));
  };
  App.acts['demo-krisis'] = function () {
    var s = App.state, ids = [];
    var langkah = [
      { jenis: 'T04', anggota_id: 'A14', nominal: 1500000, uraian: 'Penarikan sukarela untuk biaya sekolah (skenario demo)' },
      { jenis: 'T09', nominal: 12000000, uraian: 'Perbaikan atap dan rak gerai (skenario demo)' }
    ];
    for (var i = 0; i < langkah.length; i++) {
      var d = langkah[i]; d.tanggal = s.tanggalSimulasi; d.cid = App.uid();
      var r = TK.tambahEntri(s, d, 'PNG');
      if (!r.ok) { App.save(); App.toast(r.galat[0].pesan, 'bad'); return; }
      ids.push(r.entri.id);
    }
    App.save(); App.toast('Penarikan dan beban tercatat sebagai ' + ids.join(' dan ') + '. Lihat pratinjau sebelum tutup buku.');
    masukSebagai('PNG', 'tutup');
  };
  App.acts['demo-ubah'] = function () {
    var s = App.state, e = TK.cariEntri(s, 'E0269') || s.entri[Math.floor(s.entri.length / 2)];
    s._tamper = { id: e.id, baris: JSON.parse(JSON.stringify(e.baris)), uraian: e.uraian };
    e.baris.forEach(function (b) { if (b.debit) b.debit = b.debit * 10; if (b.kredit) b.kredit = b.kredit * 10; });
    App._keutuhan = null; App.save(); App.closeSheet(); App.render();
    App.toast('Nominal entri ' + e.id + ' dikalikan sepuluh tanpa menghitung ulang hash.');
  };
  App.acts['demo-pulih'] = function () {
    var s = App.state, t = s._tamper, e = TK.cariEntri(s, t.id);
    e.baris = t.baris; e.uraian = t.uraian; delete s._tamper;
    App._keutuhan = TK.periksaKeutuhan(s.entri); App.save(); App.closeSheet(); App.render();
    App.toast(App._keutuhan.ok ? 'Rantai dipulihkan. Pemeriksaan keutuhan kembali utuh.' : 'Rantai belum utuh.', App._keutuhan.ok ? '' : 'bad');
  };
  App.acts['demo-hadir'] = function () {
    var s = App.state, n = 0;
    s.anggota.forEach(function (a) {
      if (a.id === 'A04' || n >= 12) return;
      if (!s.rat.kehadiran.some(function (k) { return k.anggota_id === a.id; })) { TK.catatHadir(s, a.id, null); n++; }
    });
    var pilihan = ['Setuju', 'Setuju', 'Setuju', 'Tidak setuju', 'Setuju', 'Abstain', 'Setuju'];
    s.rat.kehadiran.forEach(function (k, i) {
      if (k.anggota_id === 'A04') return;
      s.rat.agenda.forEach(function (ag, j) { TK.kirimSuara(s, ag.id, k.anggota_id, pilihan[(i + j) % pilihan.length]); });
    });
    App.save(); App.closeSheet(); App.render(); App.toast(n + ' anggota ditandai hadir dan memberi suara.');
  };
  App.acts['demo-ulang'] = function () {
    var s = App.state;
    var d = s._terkirim[s._terkirim.length - 1];
    var sebelum = s.entri.length;
    s.antrean.push({ cid: d.cid, draft: JSON.parse(JSON.stringify(d)), status: 'Menunggu sinkron', dibuat: App.today() });
    var h = TK.sinkron(s, 'PNG'); App.save(); App.closeSheet(); App.render();
    App.toast('ID klien ' + d.cid.slice(0, 14) + '… dikirim ulang: ' + (h.duplikat.length ? 'dikenali sebagai duplikat, tidak digandakan' : 'masuk') + '. Jumlah entri tetap ' + (s.entri.length === sebelum ? sebelum : s.entri.length) + '.');
  };
  App.acts['demo-reset'] = function () {
    App.confirm({ judul: 'Atur ulang semua data simulasi?', tombol: 'Atur ulang data', bahaya: true, isi: '<p>Semua transaksi, tiket, dan RAT yang Anda buat di sesi ini hilang. Data kembali ke 16 Oktober 2026.</p>' }).then(function (ok) {
      if (!ok) return; App.reset(); App._keutuhan = null; App._hitungUlang = null; App._hasilTutup = null; App._catat = null; App.closeSheet(); App.render(); App.toast('Data simulasi diatur ulang.');
    });
  };

  /* ---------- Pemuatan awal ---------- */
  function mulai() {
    App.load();
    App.applyTheme();
    App.save();
    App.render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
