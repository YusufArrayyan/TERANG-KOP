/* TERANG-KOP — layar bersama dan komponen laporan yang dipakai beberapa peran. */
(function () {
  'use strict';
  var App = window.App, TK = window.TK, esc = App.esc, icon = App.icon, rp = App.rp, tgl = App.tgl;

  /* ================= Masuk ================= */
  App.views.masuk = {
    render: function () {
      var s = App.state;
      var opsiAnggota = s.anggota.map(function (a) {
        return '<option value="' + a.id + '"' + (a.id === 'A04' ? ' selected' : '') + '>' + esc(a.nama) + ' · ' + a.no + (a.jabatan ? ' (' + a.jabatan + ')' : '') + '</option>';
      }).join('');
      var peran = ['ANG', 'PNG', 'PGW', 'KJD', 'DIN'].map(function (k, i) {
        var P = App.PERAN[k], o = App.ORANG[k];
        return '<label class="role"><input type="radio" name="peran" value="' + k + '"' + (i === 0 ? ' checked' : '') + '>' +
          '<span class="ic">' + icon(P.ic) + '</span><span class="grow"><b>' + P.nama + (o ? ' · ' + esc(o.nama) : '') + '</b><span>' + P.desk + '</span></span></label>';
      }).join('');
      return '<div class="login">' +
        '<section class="login-side"><div><div class="logo-tile">' + App.LOGO + '</div>' +
        '<h1 translate="no">TERANG-KOP</h1><p>Pembukuan koperasi desa yang bisa dilihat pemiliknya, dengan peringatan dini sebelum masalah membesar.</p></div>' +
        '<p class="small">' + esc(s.koperasi.nama) + ' · ' + esc(s.koperasi.kabupaten) + '<br>Prototipe dengan data simulasi. Tanggal simulasi ' + App.tglPanjang(s.tanggalSimulasi) + '.</p></section>' +
        '<section class="login-main"><div><a class="crumb" href="#/">' + icon('chevL', 'sm') + 'Halaman depan</a><h2 style="font-size:1.5rem">Masuk</h2><p class="body" style="margin-top:6px">Pilih peran untuk melihat sistem dari sudut pandangnya. Prototipe ini tidak memakai otentikasi sungguhan; di produk sesungguhnya anggota masuk dengan nomor anggota dan PIN enam digit, peran lain dengan nomor ponsel dan kata sandi.</p></div>' +
        '<form class="stack lg" data-form="masuk"><fieldset class="role-list" style="border:0;padding:0;margin:0"><legend class="sr-only">Peran</legend>' + peran + '</fieldset>' +
        '<div class="field" id="pilih-anggota"><label for="f-anggota">Masuk sebagai anggota</label><select class="input" id="f-anggota" name="anggota">' + opsiAnggota + '</select>' +
        '<span class="hint">Anggota hanya melihat data dirinya dan angka agregat koperasi.</span></div>' +
        '<button class="btn primary" type="submit">Masuk</button></form></section></div>';
    },
    after: function () {
      var f = document.querySelector('[data-form="masuk"]');
      var sync = function () { document.getElementById('pilih-anggota').style.display = f.peran.value === 'ANG' ? '' : 'none'; };
      f.addEventListener('change', sync); sync();
    }
  };
  App.forms.masuk = function (f) {
    var d = App.formData(f);
    App.session = { peran: d.peran, anggota_id: d.peran === 'ANG' ? d.anggota : null };
    App.saveSession();
    var P = App.PERAN[d.peran];
    location.hash = '#/' + P.kode + '/' + P.nav[0][0];
    App.render();
  };

  /* ================= Panel skor ================= */
  App.ui.alasanSkor = function (sk, maks) {
    var pen = sk.penurun.slice(0, maks || 3);
    if (!pen.length) return '<p class="body">Semua indikator hijau.</p>';
    return '<p class="small mute">Yang paling menurunkan skor:</p><ul class="reasons">' + pen.map(function (i) {
      return '<li><b>' + esc(i.nama) + '</b> (' + TK.fmtNilaiInd(i) + '). ' + esc(i.saran) + '</li>';
    }).join('') + '</ul>';
  };
  App.ui.ringkasSkor = function (sk, judul, aksi) {
    var st = App.STATUS[sk.status];
    return '<div class="card"><div class="card-head"><h2>' + esc(judul) + '</h2>' + (aksi || '') + '</div><div class="score-wrap">' + App.gauge(sk.nilai, sk.status) +
      '<div class="stack sm" style="flex:1;min-width:0">' + App.statusBadge(sk.status, true) + '<p>' + esc(st.pesan) + '</p>' +
      (sk.status === 'Dikalibrasi' ? '<p class="small mute">Bila tidak dalam masa kalibrasi, status akan menjadi ' + esc(sk.statusTanpaKalibrasi) + '.</p>' : '') +
      App.ui.alasanSkor(sk) + '</div></div></div>';
  };
  function batas(def, w) {
    var f = function (v) { return def.satuan === 'persen' ? App.persen(v) : String(v).replace('.', ','); };
    if (def.arah === 'naik') return w === 'hijau' ? '≥ ' + f(def.hijau) : w === 'kuning' ? f(def.kuning) + ' sampai < ' + f(def.hijau) : '< ' + f(def.kuning);
    return w === 'hijau' ? '≤ ' + f(def.hijau) : w === 'kuning' ? '> ' + f(def.hijau) + ' sampai ' + f(def.kuning) : '> ' + f(def.kuning);
  }
  App.ui.batas = batas;
  App.ui.tabelIndikator = function (sk, ambang) {
    var isi = (ambang || TK.ambangAktif(App.state)).isi;
    return '<div class="table-wrap"><table class="t ind-table"><caption class="sr-only">Tujuh indikator skor</caption><thead><tr><th scope="col"><span class="sr-only">Kode</span></th><th scope="col">Indikator</th><th scope="col" class="r">Nilai</th><th scope="col">Warna</th><th scope="col" class="hide-m">Ambang hijau</th><th scope="col" class="r">Bobot</th><th scope="col" class="r">Sumbangan</th></tr></thead><tbody>' +
      sk.indikator.map(function (i) {
        return '<tr><td><span class="ind-code" aria-hidden="true">' + i.kode + '</span></td><td><b>' + esc(i.nama) + '</b><div class="xs mute">' + esc(i.rumus) + '</div></td>' +
          '<td class="r strong">' + esc(TK.fmtNilaiInd(i)) + '</td><td>' + App.indBadge(i.warna) + '</td><td class="hide-m small">' + batas(isi[i.kode], 'hijau') + '</td>' +
          '<td class="r">' + i.bobot + '</td><td class="r"><b>' + (Math.round(i.kontribusi * 10) / 10).toString().replace('.', ',') + '</b><span class="mute"> / ' + i.bobot + '</span></td></tr>';
      }).join('') + '</tbody><tfoot><tr><td></td><td colspan="5"><b>Skor akhir</b> <span class="small mute">jumlah (bobot × skor indikator) ÷ 100, dibulatkan</span></td><td class="r"><b>' + sk.nilai + '</b></td></tr></tfoot></table></div>' +
      (sk.aturan.length ? '<div class="stack sm" style="margin-top:12px">' + sk.aturan.map(function (a) { return App.callout('info', 'info', '<p>' + esc(a) + '</p>'); }).join('') + '</div>' : '');
  };
  App.ui.histori = function (items) {
    if (!items.length) return '';
    return '<div class="hist" role="img" aria-label="Riwayat skor: ' + items.map(function (b) { return TK.namaPeriode(b.periode) + ' ' + b.nilai + ' ' + b.status; }).join('; ') + '">' +
      items.map(function (b) {
        var cls = (App.STATUS[b.status] || {}).cls || '';
        return '<div class="col ' + cls + '"><b>' + b.nilai + '</b><i style="height:' + Math.max(6, b.nilai) + '%"></i><span>' + TK.BULAN[+b.periode.slice(5, 7) - 1].slice(0, 3) + '</span></div>';
      }).join('') + '</div>';
  };

  /* ================= Laporan (neraca dan laba rugi) ================= */
  App.ui.laporan = function (pid) {
    var s = App.state;
    var tahun = pid.slice(0, 4) + '-01-01';
    var p = TK.cariPeriode(s, pid);
    var sampai = p && p.asOf ? p.asOf : TK.tgl.minTgl(TK.tgl.akhirPeriode(pid), s.tanggalSimulasi);
    var nr = TK.neraca(s.entri, sampai, tahun);
    var lrB = TK.labaRugi(s.entri, TK.tgl.awalPeriode(pid), sampai);
    var lrT = TK.labaRugi(s.entri, tahun, sampai);
    var row = function (l, v, b) { return '<tr><td>' + l + '</td><td class="r' + (b ? ' strong' : '') + '">' + rp(v) + '</td></tr>'; };
    var row2 = function (l, v1, v2, b) { return '<tr' + (b ? ' class="strong"' : '') + '><td>' + l + '</td><td class="r">' + rp(v1) + '</td><td class="r">' + rp(v2) + '</td></tr>'; };
    return '<div class="grid g2"><div class="card flat"><h3 style="margin-bottom:8px">Neraca per ' + tgl(sampai) + '</h3><div class="table-wrap"><table class="t"><tbody>' +
      row('Kas', nr.kas) + row('Bank', nr.bank) + row('Piutang pinjaman anggota', nr.piutang) + row('Penyisihan pinjaman bermasalah', nr.penyisihan) + row('<b>Jumlah aset</b>', nr.aset, 1) +
      row('Simpanan sukarela', nr.sukarela) + row('Utang bank', nr.utangBank) + row('Simpanan pokok', nr.pokok) + row('Simpanan wajib', nr.wajib) +
      row('Cadangan', nr.cadangan) + row('SHU tahun berjalan', nr.shu) + row('<b>Jumlah kewajiban dan ekuitas</b>', nr.kewajiban + nr.ekuitas, 1) +
      '</tbody></table></div></div><div class="card flat"><h3 style="margin-bottom:8px">Laba rugi</h3><div class="table-wrap"><table class="t"><thead><tr><th></th><th class="r">' + TK.namaBulan(pid) + '</th><th class="r">Tahun berjalan</th></tr></thead><tbody>' +
      row2('Penjualan gerai', lrB.penjualan, lrT.penjualan) + row2('Jasa pinjaman', lrB.jasa, lrT.jasa) + row2('Jumlah pendapatan', lrB.pendapatan, lrT.pendapatan, 1) +
      row2('Beban pokok penjualan', lrB.hpp, lrT.hpp) + row2('Beban operasional', lrB.operasional, lrT.operasional) + row2('Beban penyisihan', lrB.penyisihan, lrT.penyisihan) +
      row2('Beban bunga bank', lrB.bunga, lrT.bunga) + row2('Jumlah beban', lrB.beban, lrT.beban, 1) + row2('SHU', lrB.shu, lrT.shu, 1) +
      '</tbody></table></div></div></div>';
  };

  /* ================= Pemeriksaan keutuhan ================= */
  App.ui.hasilKeutuhan = function (r) {
    if (!r) return '';
    if (r.ok) return App.callout('ok', 'checkCircle', '<p><b>Rantai utuh.</b> ' + r.diperiksa + ' entri diperiksa ulang dari entri pertama; setiap hash cocok. Hash ujung <span class="hash">' + App.pendek(r.ujung, 16) + '</span>.</p>');
    return App.callout('bad', 'octagon', '<p><b>Entri ' + esc(r.pertama) + ' adalah yang pertama tidak cocok.</b> ' + esc(r.alasan) + '. Entri sesudahnya ikut tidak dapat dipercaya sampai rantai dipulihkan.</p>' +
      '<p class="small" style="margin-top:6px"><a href="' + App.href('buku', r.pertama) + '">Buka entri ' + esc(r.pertama) + '</a></p>');
  };
  App.acts.keutuhan = function () {
    App._keutuhan = TK.periksaKeutuhan(App.state.entri);
    App._keutuhan.waktu = App.today();
    App.render();
    var el = document.getElementById('hasil-keutuhan'); if (el) el.scrollIntoView({ block: 'nearest' });
  };

  /* ================= Buku besar (PNG dan PGW) ================= */
  function nominalEntri(e) { return e.baris.reduce(function (a, b) { return a + (b.debit || 0); }, 0); }
  App.ui.nominalEntri = nominalEntri;
  App.views.buku = {
    title: 'Buku besar',
    render: function (r) {
      if (r.arg) return App.views.buku.detail(r.arg);
      var s = App.state, q = r.q || {};
      var per = q.p || '';
      var jen = q.j || '';
      var cari = (q.c || '').toLowerCase();
      var batas = +(q.n || 40);
      var dibalik = {};
      s.entri.forEach(function (e) { if (e.entri_asal_id) dibalik[e.entri_asal_id] = e.id; });
      var list = s.entri.filter(function (e) {
        return (!per || e.tanggal.slice(0, 7) === per) && (!jen || e.jenis === jen) &&
          (!cari || (e.id + ' ' + e.uraian + ' ' + App.namaAnggota(e.anggota_id)).toLowerCase().indexOf(cari) >= 0);
      }).slice().reverse();
      var periodeOpts = s.periode.slice().reverse().map(function (p) { return '<option value="' + p.id + '"' + (p.id === per ? ' selected' : '') + '>' + TK.namaPeriode(p.id) + ' · ' + p.status + '</option>'; }).join('');
      var jenisOpts = Object.keys(TK.JENIS).map(function (k) { return '<option value="' + k + '"' + (k === jen ? ' selected' : '') + '>' + k + ' ' + TK.JENIS[k].nama + '</option>'; }).join('');
      var rows = list.slice(0, batas).map(function (e) {
        return '<tr class="click" data-act="buka-entri" data-id="' + e.id + '"><td><a href="' + App.href('buku', e.id) + '" class="mono strong">' + e.id + '</a></td><td data-hide-m class="num">' + tgl(e.tanggal) + '</td>' +
          '<td>' + esc(e.uraian) + '<div class="xs mute">' + e.jenis + ' · ' + esc(TK.JENIS[e.jenis].nama) + (e.anggota_id ? ' · ' + esc(App.namaAnggota(e.anggota_id)) : '') + '</div></td>' +
          '<td class="r strong">' + rp(nominalEntri(e)) + (dibalik[e.id] ? '<div>' + App.chip('Dibalik ' + dibalik[e.id], '', 'undo') + '</div>' : '') + '</td></tr>';
      }).join('');
      var peran = App.session.peran;
      return App.pageHead('Buku besar', 'Buku besar hanya-tambah: entri tidak dapat diubah atau dihapus. Koreksi memakai entri pembalik T13 yang wajib beralasan.',
        '<button class="btn outline" data-act="keutuhan">' + icon('link') + 'Periksa keutuhan</button>' + (peran === 'PNG' ? '<a class="btn primary" href="' + App.href('catat') + '">' + icon('plus') + 'Catat transaksi</a>' : '')) +
        '<div id="hasil-keutuhan" class="stack" style="margin-bottom:16px">' + App.ui.hasilKeutuhan(App._keutuhan) + '</div>' +
        '<div class="card"><form class="form-grid" data-form="filter-buku" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:12px">' +
        '<div class="field"><label for="fb-p">Periode</label><select class="input" id="fb-p" name="p" data-change="filter-buku"><option value="">Semua periode</option>' + periodeOpts + '</select></div>' +
        '<div class="field"><label for="fb-j">Jenis</label><select class="input" id="fb-j" name="j" data-change="filter-buku"><option value="">Semua jenis</option>' + jenisOpts + '</select></div>' +
        '<div class="field"><label for="fb-c">Cari</label><input class="input" id="fb-c" name="c" type="search" value="' + esc(q.c || '') + '" placeholder="Contoh: E0269, angsuran, Siti…" autocomplete="off" spellcheck="false"></div></form>' +
        '<p class="small mute" style="margin-bottom:8px" aria-live="polite">' + list.length + ' entri' + (list.length > batas ? ', menampilkan ' + batas + ' terbaru' : '') + '. Total di buku besar: ' + s.entri.length + '.</p>' +
        (list.length ? '<div class="table-wrap"><table class="t stackable"><thead><tr><th scope="col">ID</th><th scope="col">Tanggal</th><th scope="col">Uraian</th><th scope="col" class="r">Nominal</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          (list.length > batas ? '<div class="row" style="justify-content:center;margin-top:16px"><button class="btn secondary" data-act="buku-lagi">Tampilkan 40 lagi</button></div>' : '')
          : App.empty('book', 'Tidak ada entri yang cocok', 'Ubah saringan periode, jenis, atau kata pencarian.', '<button class="btn secondary" data-act="buku-reset">Hapus saringan</button>')) + '</div>';
    },
    detail: function (id) {
      var s = App.state, e = TK.cariEntri(s, id);
      if (!e) return App.pageHead('Entri tidak ditemukan', null, null, [App.href('buku'), 'Buku besar']) + App.empty('book', 'Entri ' + esc(id) + ' tidak ada', 'Periksa ID entri, lalu cari lagi dari buku besar.');
      var pembalik = s.entri.filter(function (x) { return x.entri_asal_id === e.id; })[0];
      var keut = App._keutuhan && !App._keutuhan.ok && App._keutuhan.pertama === e.id;
      var recomputed = TK.hashEntri(e, e.prev_hash);
      var bisaKoreksi = App.session.peran === 'PNG' && e.jenis !== 'T13' && !pembalik;
      var baris = e.baris.map(function (b) { return '<tr><td class="mono">' + b.akun + '</td><td>' + esc(TK.AKUN[b.akun].nama) + '</td><td class="r">' + (b.debit ? rp(b.debit) : '') + '</td><td class="r">' + (b.kredit ? rp(b.kredit) : '') + '</td></tr>'; }).join('');
      var idx = s.entri.indexOf(e);
      var prev = idx > 0 ? s.entri[idx - 1] : null, next = s.entri[idx + 1];
      return App.pageHead('Entri ' + e.id, esc(e.uraian), null, [App.href('buku'), 'Buku besar']) +
        '<div class="stack lg">' + (keut ? App.callout('bad', 'octagon', '<p><b>Isi entri ini tidak cocok dengan hash yang tersimpan.</b> Hash dihitung ulang: <span class="hash">' + App.pendek(recomputed, 16) + '</span>, tersimpan: <span class="hash">' + App.pendek(e.hash, 16) + '</span>.</p>') : '') +
        (pembalik ? App.callout('info', 'undo', '<p>Entri ini sudah dibalik oleh <a href="' + App.href('buku', pembalik.id) + '">' + pembalik.id + '</a>. Alasan: ' + esc(pembalik.alasan) + '</p>') : '') +
        '<div class="grid g2"><div class="card"><dl class="dl"><dt>Tanggal</dt><dd>' + App.tglPanjang(e.tanggal) + '</dd><dt>Jenis</dt><dd>' + e.jenis + ' · ' + esc(TK.JENIS[e.jenis].nama) + '</dd>' +
        (e.anggota_id ? '<dt>Anggota</dt><dd>' + esc(App.namaAnggota(e.anggota_id)) + ' · ' + App.anggota(e.anggota_id).no + '</dd>' : '') +
        (e.pinjaman_id ? '<dt>Pinjaman</dt><dd>' + e.pinjaman_id + '</dd>' : '') +
        (e.entri_asal_id ? '<dt>Membalik</dt><dd><a href="' + App.href('buku', e.entri_asal_id) + '">' + e.entri_asal_id + '</a></dd><dt>Alasan</dt><dd>' + esc(e.alasan) + '</dd>' : '') +
        '<dt>Nomor urut</dt><dd class="num">' + e.seq + '</dd><dt>ID klien</dt><dd class="hash">' + esc(e.cid) + '</dd></dl></div>' +
        '<div class="card"><h3 style="margin-bottom:8px">Jurnal</h3><div class="table-wrap"><table class="t"><thead><tr><th>Akun</th><th>Nama akun</th><th class="r">Debit</th><th class="r">Kredit</th></tr></thead><tbody>' + baris + '</tbody></table></div></div></div>' +
        '<div class="card"><h3 style="margin-bottom:12px">Rantai hash SHA-256</h3><div class="chain">' +
        (prev ? '<div class="link"><span class="small mute">Sebelum</span><span><a href="' + App.href('buku', prev.id) + '" class="mono">' + prev.id + '</a> <span class="hash">' + App.pendek(prev.hash, 16) + '</span></span></div>' : '<div class="link"><span class="small mute">Sebelum</span><span class="small">Entri pertama, mengait ke hash awal nol.</span></div>') +
        '<div class="link' + (keut ? ' bad' : '') + '"><span class="small strong">Entri ini</span><span class="stack sm"><span class="small mute">Hash sebelumnya</span><span class="hash">' + esc(e.prev_hash) + '</span><span class="small mute">Hash entri</span><span class="hash">' + esc(e.hash) + '</span></span></div>' +
        (next ? '<div class="link"><span class="small mute">Sesudah</span><span><a href="' + App.href('buku', next.id) + '" class="mono">' + next.id + '</a> mengait ke hash entri ini</span></div>' : '') +
        '</div><p class="small mute" style="margin-top:12px">Hash setiap entri dihitung dari isi entri dan hash entri sebelumnya. Perubahan diam-diam terdeteksi, tetapi ini penanda keutuhan, bukan blockchain.</p></div>' +
        (bisaKoreksi ? '<div class="card"><h3>Koreksi entri</h3><p class="body" style="margin:6px 0 16px">Entri tidak dapat diubah. Untuk memperbaiki, catat entri pembalik T13 di periode berjalan; jurnalnya kebalikan dari entri ini. Setelah itu, catat transaksi yang benar sebagai entri baru.</p>' +
          '<form class="stack" data-form="koreksi" data-id="' + e.id + '"><div class="field"><label for="k-alasan">Alasan koreksi</label><textarea class="input" id="k-alasan" name="alasan" required minlength="5" placeholder="Contoh: nominal salah ketik, seharusnya Rp25.000…"></textarea></div>' +
          '<div><button class="btn outline" type="submit">' + icon('undo') + 'Catat entri pembalik untuk ' + e.id + '</button></div></form></div>' : '') +
        '</div>';
    }
  };
  App.acts['buka-entri'] = function (el, e) { if (e.target.closest('a')) return; App.go('buku', el.getAttribute('data-id')); };
  App.acts['filter-buku'] = function (el) {
    var f = el.form, d = App.formData(f);
    var q = []; ['p', 'j', 'c'].forEach(function (k) { if (d[k]) q.push(k + '=' + encodeURIComponent(d[k])); });
    location.hash = App.href('buku') + (q.length ? '?' + q.join('&') : '');
  };
  App.forms['filter-buku'] = function (f) { App.acts['filter-buku']({ form: f }); };
  App.acts['buku-lagi'] = function () {
    var r = App.route(); var q = r.q; q.n = String(+(q.n || 40) + 40);
    location.hash = App.href('buku') + '?' + Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
  };
  App.acts['buku-reset'] = function () { location.hash = App.href('buku'); };
  App.forms.koreksi = function (f) {
    var id = f.getAttribute('data-id'), alasan = f.alasan.value.trim();
    if (alasan.length < 5) { App.toast('Tulis alasan koreksi, minimal lima huruf.', 'bad'); f.alasan.focus(); return; }
    var pb = TK.periodeBerjalan(App.state);
    App.confirm({ judul: 'Catat entri pembalik untuk ' + id + '?', tombol: 'Catat entri pembalik',
      isi: '<p>Sistem mencatat entri T13 bertanggal ' + tgl(App.today()) + ' dengan jurnal kebalikan dari ' + esc(id) + '. Entri asal tetap ada di buku besar dan tidak dapat dibalik dua kali.</p><p class="small">Alasan: ' + esc(alasan) + '</p>' }).then(function (ok) {
      if (!ok) return;
      var draft = { jenis: 'T13', tanggal: App.today(), entri_asal_id: id, alasan: alasan, cid: App.uid() };
      if (!App.state.online) {
        App.state.antrean.push({ cid: draft.cid, draft: draft, status: 'Menunggu sinkron', dibuat: App.today() });
        App.save(); App.toast('Luring: entri pembalik masuk antrean Menunggu sinkron.'); App.go('catat'); return;
      }
      var r = TK.tambahEntri(App.state, draft, 'PNG');
      if (!r.ok) { App.toast(r.galat[0].pesan, 'bad'); return; }
      App.save(); App.toast('Entri pembalik ' + r.entri.id + ' tercatat.'); App.go('buku', r.entri.id);
      void pb;
    });
  };

  /* ================= Tiket (semua peran) ================= */
  var ALUR = ['Terbuka', 'Diproses', 'Menunggu verifikasi', 'Selesai'];
  App.ui.chipTiket = function (t) {
    var late = App.terlambat(t) ? ' ' + App.chip('Terlambat', 'late', 'clock') : '';
    return App.chip(t.status, t.status === 'Selesai' ? '' : 'amber') + late;
  };
  App.ui.daftarTiket = function (list, layar, kosong) {
    if (!list.length) return kosong || App.empty('ticket', 'Tidak ada tiket', 'Tiket dibuat otomatis saat tutup buku bila status koperasi Waspada atau Perlu tindakan.');
    return '<div class="table-wrap"><table class="t stackable"><thead><tr><th scope="col">Tiket</th><th scope="col">Koperasi dan ringkasan</th><th scope="col">Tenggat</th><th scope="col">Status</th></tr></thead><tbody>' +
      list.map(function (t) {
        var k = App.kopById(t.koperasi_id);
        return '<tr class="click' + (App.terlambat(t) ? ' flag' : '') + '" data-act="buka-tiket" data-layar="' + layar + '" data-id="' + t.id + '"><td><a class="mono strong" href="' + App.href(layar, t.id) + '">' + t.id + '</a><div class="xs mute">' + esc(t.jenis) + '</div></td>' +
          '<td><b>' + esc(k ? k.nama.replace('Kopdes Merah Putih ', 'Kopdes ') : t.koperasi_id) + '</b><div class="small body">' + esc(t.ringkasan) + '</div></td>' +
          '<td data-hide-m class="num">' + tgl(t.tenggat) + '</td><td>' + App.ui.chipTiket(t) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  };
  App.acts['buka-tiket'] = function (el, e) { if (e.target.closest('a')) return; App.go(el.getAttribute('data-layar'), el.getAttribute('data-id')); };

  App.ui.detailTiket = function (id, layar, judulKembali) {
    var s = App.state, t = s.tiket.filter(function (x) { return x.id === id; })[0];
    if (!t) return App.pageHead('Tiket tidak ditemukan', null, null, [App.href(layar), judulKembali]) + App.empty('ticket', 'Tiket ' + esc(id) + ' tidak ada', 'Kembali ke daftar tiket.');
    var k = App.kopById(t.koperasi_id);
    var peran = App.session.peran;
    var iStatus = ALUR.indexOf(t.status);
    var langkah = (t.jenis === 'Pendampingan' ? ['Terbuka', 'Diproses', 'Selesai'] : t.jenis === 'Pengingat' ? ['Terbuka', 'Selesai'] : ALUR).map(function (st) {
      var i = ALUR.indexOf(st);
      var cls = i < iStatus ? 'done' : i === iStatus ? 'attn' : '';
      return '<div class="task ' + cls + '" style="min-height:52px;padding:10px 14px"><span class="ic" style="width:32px;height:32px">' + icon(i < iStatus ? 'check' : i === iStatus ? 'clock' : 'more', 'sm') + '</span><div class="grow"><b>' + st + '</b></div></div>';
    }).join('');
    var aksi = '';
    var milikSukamaju = t.koperasi_id === s.koperasi.id;
    if (t.jenis === 'Tindak lanjut' && peran === 'PNG' && milikSukamaju) {
      if (t.status === 'Terbuka') aksi = '<button class="btn primary" data-act="tiket-status" data-id="' + t.id + '" data-ke="Diproses">Mulai proses tindak lanjut</button>';
      if (t.status === 'Diproses') aksi = '<form class="stack" data-form="tiket-penjelasan" data-id="' + t.id + '"><div class="field"><label for="tp">Penjelasan tertulis kepada anggota</label><textarea class="input" id="tp" name="penjelasan" required minlength="20" placeholder="Apa yang terjadi, apa yang sudah dan akan dilakukan pengurus, dan kapan anggota bisa melihat hasilnya…">' + esc(t.penjelasan) + '</textarea><span class="hint">Wajib. Penjelasan ini tampil di beranda setiap anggota.</span></div><div class="row"><button class="btn primary" type="submit">' + icon('send') + 'Kirim untuk verifikasi pengawas</button></div></form>';
    }
    if (t.jenis === 'Tindak lanjut' && peran === 'PGW' && milikSukamaju && t.status === 'Menunggu verifikasi') {
      aksi = '<div class="row"><button class="btn primary" data-act="tiket-verifikasi" data-id="' + t.id + '">' + icon('checkCircle') + 'Verifikasi dan selesaikan</button><button class="btn outline" data-act="tiket-kembalikan" data-id="' + t.id + '">Kembalikan ke pengurus</button></div>';
    }
    if (t.jenis === 'Pendampingan' && peran === 'KJD') {
      if (t.status === 'Terbuka') aksi = '<button class="btn primary" data-act="tiket-kontak" data-id="' + t.id + '">Catat kontak pertama</button>';
      if (t.status === 'Diproses') aksi = '<button class="btn primary" data-act="tiket-selesai-kjd" data-id="' + t.id + '">' + icon('checkCircle') + 'Selesaikan pendampingan</button>';
    }
    if (t.jenis === 'Pengingat' && peran === 'PNG' && milikSukamaju && t.status !== 'Selesai') {
      aksi = '<p class="body">Tiket ini tertutup otomatis saat laporan ' + TK.namaPeriode(t.periode_id) + ' disahkan pengawas.</p><div><a class="btn primary" href="' + App.href('tutup') + '">' + icon('lock') + 'Buka tutup buku</a></div>';
    }
    var bolehCatat = t.status !== 'Selesai' && (peran === 'KJD' || peran === 'DIN' || (milikSukamaju && (peran === 'PNG' || peran === 'PGW')));
    return App.pageHead(t.id + ' · ' + t.jenis, esc(k ? k.nama : t.koperasi_id) + ' · periode ' + TK.namaPeriode(t.periode_id), null, [App.href(layar), judulKembali]) +
      '<div class="grid g3" style="align-items:start"><div class="stack lg span2">' +
      (App.terlambat(t) ? App.callout('bad', 'clock', '<p><b>Terlambat.</b> Tenggat ' + App.tglPanjang(t.tenggat) + ' sudah lewat. Tiket tetap harus ditutup; dinas melihat tanda ini di dasbor wilayah.</p>') : '') +
      '<div class="card"><p>' + esc(t.ringkasan) + '</p><hr class="div" style="margin:16px 0"><dl class="dl"><dt>Status</dt><dd>' + App.ui.chipTiket(t) + '</dd><dt>Dibuat</dt><dd>' + App.tglPanjang(t.dibuat) + '</dd><dt>Tenggat</dt><dd>' + App.tglPanjang(t.tenggat) +
      (t.jenis === 'Pendampingan' ? ' <span class="small mute">(kontak pertama, 7 hari kerja)</span>' : t.jenis === 'Pengingat' ? ' <span class="small mute">(laporan bulanan terbit paling lambat tanggal 10)</span>' : ' <span class="small mute">(14 hari kalender sejak tutup buku)</span>') + '</dd>' +
      '<dt>Penerima</dt><dd>' + esc(t.pemilik_nama) + '</dd><dt>Salinan</dt><dd>' + esc((t.salinan || []).join(', ')) + '</dd></dl></div>' +
      (t.penjelasan ? '<div class="card tint"><h3 style="margin-bottom:6px">Penjelasan kepada anggota</h3><p>' + esc(t.penjelasan) + '</p></div>' : '') +
      (aksi ? '<div class="card">' + aksi + '</div>' : '') +
      '<div class="card"><h3 style="margin-bottom:8px">Catatan</h3>' + (t.catatan.length ? '<div class="list">' + t.catatan.map(function (c) {
        return '<div class="li"><span class="avatar" style="background:var(--surface-3);color:var(--ink)">' + App.inisial(c.oleh) + '</span><div class="grow"><b class="small">' + esc(c.oleh) + '</b> <span class="xs mute">' + tgl(c.tanggal) + '</span><p>' + esc(c.teks) + '</p></div></div>';
      }).join('') + '</div>' : '<p class="body">Belum ada catatan.</p>') +
      (bolehCatat ? '<form class="stack" data-form="tiket-catatan" data-id="' + t.id + '" style="margin-top:12px"><div class="field"><label for="tc">Tambah catatan</label><textarea class="input" id="tc" name="teks" required placeholder="Contoh: kunjungan ke gerai, pengurus menyusun jadwal penagihan…"></textarea></div><div><button class="btn secondary" type="submit">Simpan catatan</button></div></form>' : '') +
      '</div></div><div class="card tint stack sm"><h3>Alur tiket</h3>' + langkah + '<p class="small mute">Penanda Terlambat berlaku di atas status bila tenggat lewat.</p></div></div>';
  };
  function cariTiket(id) { return App.state.tiket.filter(function (x) { return x.id === id; })[0]; }
  function catatTiket(t, teks) { var u = App.pengguna(); t.catatan.push({ oleh: u.nama + ' (' + App.PERAN[App.session.peran].nama + ')', tanggal: App.today(), teks: teks }); }
  App.acts['tiket-status'] = function (el) { var t = cariTiket(el.getAttribute('data-id')); t.status = el.getAttribute('data-ke'); catatTiket(t, 'Status diubah menjadi ' + t.status + '.'); App.save(); App.toast(t.id + ' sekarang ' + t.status + '.'); App.render(); };
  App.forms['tiket-penjelasan'] = function (f) {
    var t = cariTiket(f.getAttribute('data-id')), v = f.penjelasan.value.trim();
    if (v.length < 20) { App.toast('Penjelasan terlalu singkat. Tulis minimal 20 huruf agar anggota memahami langkah pengurus.', 'bad'); f.penjelasan.focus(); return; }
    App.confirm({ judul: 'Kirim ' + t.id + ' untuk verifikasi?', tombol: 'Kirim untuk verifikasi', isi: '<p>Penjelasan langsung tampil di beranda anggota. Pengawas lalu memverifikasi sebelum tiket selesai.</p>' }).then(function (ok) {
      if (!ok) return;
      t.penjelasan = v; t.status = 'Menunggu verifikasi'; catatTiket(t, 'Penjelasan tertulis dibagikan kepada anggota; menunggu verifikasi pengawas.');
      App.save(); App.toast(t.id + ' menunggu verifikasi pengawas.'); App.render();
    });
  };
  App.acts['tiket-verifikasi'] = function (el) {
    var t = cariTiket(el.getAttribute('data-id'));
    App.confirm({ judul: 'Selesaikan ' + t.id + '?', tombol: 'Verifikasi dan selesaikan', isi: '<p>Anda menyatakan tindak lanjut sudah dilakukan dan penjelasan sudah dibagikan kepada anggota.</p>' }).then(function (ok) {
      if (!ok) return; t.status = 'Selesai'; t.selesai_pada = App.today(); catatTiket(t, 'Diverifikasi pengawas. Tiket selesai.'); App.save(); App.toast(t.id + ' selesai.'); App.render();
    });
  };
  App.acts['tiket-kembalikan'] = function (el) { var t = cariTiket(el.getAttribute('data-id')); t.status = 'Diproses'; catatTiket(t, 'Dikembalikan ke pengurus untuk dilengkapi.'); App.save(); App.toast(t.id + ' dikembalikan ke pengurus.'); App.render(); };
  App.acts['tiket-kontak'] = function (el) { var t = cariTiket(el.getAttribute('data-id')); t.status = 'Diproses'; catatTiket(t, 'Kontak pertama dengan pengurus dilakukan.'); App.save(); App.toast('Kontak pertama tercatat.'); App.render(); };
  App.acts['tiket-selesai-kjd'] = function (el) {
    var t = cariTiket(el.getAttribute('data-id'));
    App.confirm({ judul: 'Selesaikan pendampingan ' + t.id + '?', tombol: 'Selesaikan pendampingan', isi: '<p>Tiket ditutup. Bila status koperasi masih Waspada di bulan berikutnya, tiket baru dibuat otomatis saat tutup buku.</p>' }).then(function (ok) {
      if (!ok) return; t.status = 'Selesai'; t.selesai_pada = App.today(); catatTiket(t, 'Pendampingan selesai.'); App.save(); App.render();
    });
  };
  App.forms['tiket-catatan'] = function (f) { var t = cariTiket(f.getAttribute('data-id')), v = f.teks.value.trim(); if (!v) { f.teks.focus(); return; } catatTiket(t, v); App.save(); App.toast('Catatan tersimpan.'); App.render(); };

  /* ================= Detail koperasi (KJD dan DIN) ================= */
  App.ui.detailKoperasi = function (id, layar, judulKembali) {
    var k = App.kopById(id);
    if (!k) return App.pageHead('Koperasi tidak ditemukan', null, null, [App.href(layar), judulKembali]) + App.empty('map', 'Koperasi tidak ditemukan', 'Kembali ke daftar koperasi.');
    var peran = App.session.peran;
    var akhir = k.bulan[k.bulan.length - 1];
    var sk = k.sintetis ? TK.hitungSkor(akhir.ringkasan, TK.AMBANG_V1) : App.skorDetail(akhir.periode);
    var tiket = App.tiketKop(k.id).slice().reverse();
    var hu = App._hitungUlang && App._hitungUlang.id === k.id ? App._hitungUlang.hasil : null;
    var huHtml = hu ? '<div class="stack" id="hasil-hu">' + App.callout(hu.every(function (x) { return x.sama; }) ? 'ok' : 'bad', hu.every(function (x) { return x.sama; }) ? 'checkCircle' : 'octagon',
      '<p><b>' + (hu.every(function (x) { return x.sama; }) ? 'Hasil hitung ulang sama dengan semua periode tersimpan.' : 'Ada periode yang hasilnya berbeda.') + '</b> ' + hu.length + ' periode dihitung ulang dari ' + (k.sintetis ? 'ringkasan bulanan' : 'buku besar') + ' dengan versi ambang yang tersimpan.</p>') +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Periode</th><th class="r">Tersimpan</th><th class="r">Hitung ulang</th><th>Status</th><th>Ambang</th><th>Hasil</th></tr></thead><tbody>' +
      hu.map(function (x) { return '<tr><td>' + TK.namaPeriode(x.periode_id) + '</td><td class="r">' + x.tersimpan + '</td><td class="r strong">' + x.hitung + '</td><td>' + App.statusBadge(x.statusHitung) + '</td><td class="small">' + x.ambang_versi + '</td><td>' + (x.sama ? '<span class="ind hijau">' + icon('check', 'sm') + 'Sama</span>' : '<span class="ind merah">' + icon('x', 'sm') + 'Berbeda</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>' : '';
    var kepatuhan = k.bulan.filter(App.tepatWaktu).length;
    return App.pageHead(k.nama, esc(k.kecamatan) + ' · ' + k.anggota + ' anggota · pendamping ' + esc(k.pendamping_utama) + (k.sintetis ? ' · koperasi simulasi' : ' · data dari buku besar simulasi'),
      peran === 'DIN' ? '<button class="btn primary" data-act="hitung-ulang" data-id="' + k.id + '">' + icon('refresh') + 'Hitung ulang</button>' : '', [App.href(layar), judulKembali]) +
      '<div class="stack lg">' + huHtml +
      App.ui.ringkasSkor(sk, 'Skor ' + TK.namaPeriode(akhir.periode)) +
      '<div class="grid g2"><div class="card"><h2 style="margin-bottom:12px">Riwayat skor</h2>' + App.ui.histori(k.bulan) + '</div>' +
      '<div class="card"><h2 style="margin-bottom:12px">Kepatuhan dan RAT</h2><dl class="dl"><dt>Laporan tepat waktu</dt><dd>' + kepatuhan + ' dari ' + k.bulan.length + ' bulan terbit paling lambat tanggal 10</dd>' +
      '<dt>RAT</dt><dd>' + (k.rat.tanggal ? App.tglPanjang(k.rat.tanggal) + ' · ' + esc(k.rat.status) + (k.rat.paket_h ? ' (paket H-' + k.rat.paket_h + ')' : '') : 'Belum dijadwalkan') + '</dd>' +
      '<dt>Anggota buka ringkasan</dt><dd>' + k.bukaKuartal + ' dari ' + k.anggota + ' dalam 90 hari terakhir</dd></dl>' +
      (!k.sintetis && peran === 'DIN' ? '<div class="row" style="margin-top:16px"><button class="btn outline sm" data-act="keutuhan">' + icon('link') + 'Periksa keutuhan buku besar</button></div><div id="hasil-keutuhan" style="margin-top:12px">' + App.ui.hasilKeutuhan(App._keutuhan) + '</div>' : '') +
      '</div></div>' +
      '<div class="card"><h2 style="margin-bottom:12px">Rincian indikator</h2>' + App.ui.tabelIndikator(sk) + '</div>' +
      '<div class="card"><h2 style="margin-bottom:12px">Tiket</h2>' + App.ui.daftarTiket(tiket, layar === 'wilayah' ? 'tiketdin' : 'tiket', App.empty('ticket', 'Belum ada tiket', 'Koperasi ini belum pernah memicu tiket Pendampingan atau Tindak lanjut.')) + '</div>' +
      '</div>';
  };
  App.acts['hitung-ulang'] = function (el) {
    var id = el.getAttribute('data-id'), k = App.kopById(id), hasil;
    if (k.sintetis) {
      hasil = k.bulan.map(function (b) { var sk = TK.hitungSkor(b.ringkasan, TK.AMBANG_V1); return { periode_id: b.periode, tersimpan: b.nilai, statusTersimpan: b.status, hitung: sk.nilai, statusHitung: sk.status, sama: sk.nilai === b.nilai && sk.status === b.status, ambang_versi: b.ambang_versi }; });
    } else hasil = TK.hitungUlang(App.state);
    App._hitungUlang = { id: id, hasil: hasil };
    App.render();
    var h = document.getElementById('hasil-hu'); if (h) h.scrollIntoView({ block: 'start' });
    App.toast('Hitung ulang selesai: ' + hasil.filter(function (x) { return x.sama; }).length + ' dari ' + hasil.length + ' periode sama.');
  };

  /* ================= Cara skor dihitung ================= */
  App.views['cara-skor'] = {
    title: 'Cara skor dihitung',
    render: function () {
      var amb = TK.ambangAktif(App.state);
      var rows = TK.URUTAN_IND.map(function (k) {
        var d = amb.isi[k];
        return '<tr><td><span class="ind-code">' + k + '</span></td><td><b>' + esc(d.nama) + '</b><div class="xs mute">' + esc(d.rumus) + '</div></td><td class="small">' + batas(d, 'hijau') + '</td><td class="small">' + batas(d, 'kuning') + '</td><td class="small">' + batas(d, 'merah') + '</td><td class="r">' + d.bobot + '</td></tr>';
      }).join('');
      return App.pageHead('Cara skor dihitung', 'Skor kesehatan adalah peringatan dini, bukan penilaian hukum. Sistem tidak pernah menyatakan koperasi bangkrut atau melanggar hukum.') +
        '<div class="stack lg"><div class="card"><h2 style="margin-bottom:8px">Dari buku besar ke status</h2><ol class="stack sm body" style="padding-left:20px;margin:0">' +
        '<li>Saat tutup buku, sistem membaca buku besar sampai akhir bulan dan menghitung tujuh indikator adaptasi kerangka PEARLS (Evans &amp; Branch, 2002).</li>' +
        '<li>Setiap indikator diberi warna: hijau bernilai 100, kuning 60, merah 20.</li>' +
        '<li>Skor akhir = jumlah (bobot × nilai warna) ÷ 100, dibulatkan. Skor 80 ke atas Sehat, 55 sampai 79 Waspada, di bawah 55 Perlu tindakan.</li>' +
        '<li>Tiga aturan penaik: bila likuiditas merah, status minimal Waspada; bila dua indikator atau lebih merah, status Perlu tindakan; tiga bulan buku pertama berstatus Dikalibrasi.</li>' +
        '<li>Bila penyebut nol dan pembilang nol, indikator hijau dengan keterangan tidak ada data. Bila penyebut nol dan pembilang positif, merah.</li></ol></div>' +
        '<div class="card"><div class="card-head"><h2>Ambang ' + esc(amb.versi) + '</h2><span class="small mute">Disetujui ' + esc(amb.disetujui_oleh) + ', ' + tgl(amb.tanggal) + '</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th></th><th>Indikator dan rumus</th><th>Hijau</th><th>Kuning</th><th>Merah</th><th class="r">Bobot</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="small mute" style="margin-top:12px">Seluruh ambang adalah ambang awal simulasi yang disetujui dinas, bukan angka resmi PEARLS atau pemerintah. Skor menyimpan versi ambang yang dipakai, sehingga dinas dapat menghitung ulang dengan aturan yang sama.</p></div>' +
        '<div class="card tint"><h2 style="margin-bottom:8px">Setelah status keluar</h2><ul class="stack sm body" style="padding-left:20px;margin:0"><li><b>Waspada</b> membuat tiket Pendampingan untuk pendamping KJDP; kontak pertama dalam 7 hari kerja.</li><li><b>Perlu tindakan</b> membuat tiket Tindak lanjut untuk pengurus dengan tenggat 14 hari. Pengurus wajib menulis penjelasan kepada anggota, lalu pengawas memverifikasi.</li><li>Tiket yang lewat tenggat bertanda <b>Terlambat</b> dan tampil merah di dasbor dinas.</li></ul></div></div>';
    }
  };

  /* ================= Tentang prototipe ================= */
  App.views.tentang = {
    title: 'Tentang prototipe',
    render: function () {
      var dua = function (a, b) { return '<tr><td>' + a + '</td><td>' + b + '</td></tr>'; };
      return App.pageHead('Tentang prototipe', 'Prototipe ini membuktikan bahwa aturan sistem dapat dijalankan dari data buku besar, bukan bahwa sistem sudah bekerja di lapangan.') +
        '<div class="stack lg"><div class="grid g2"><div class="card"><h2 style="margin-bottom:8px">Yang disimulasikan</h2><ul class="stack sm body" style="padding-left:20px;margin:0"><li>Jurnal ganda T01 sampai T13, koreksi dengan entri pembalik, rantai hash SHA-256</li><li>Antrean luring dan sinkron idempoten</li><li>Skor PEARLS adaptasi dari buku besar, dengan mesin yang sama untuk semua peran</li><li>e-RAT: paket terkunci hash, daftar hadir, suara, berita acara</li><li>Tiket, eskalasi, dasbor dinas dengan 30 koperasi, papan KPI</li></ul></div>' +
        '<div class="card"><h2 style="margin-bottom:8px">Yang tidak disimulasikan</h2><ul class="stack sm body" style="padding-left:20px;margin:0"><li>Otentikasi sungguhan (peran dipilih di layar masuk)</li><li>Sinkronisasi ke server; data hanya di penyimpanan peramban ini</li><li>Notifikasi</li><li>Integrasi Simkopdes dan bank</li><li>Data pribadi nyata</li></ul></div></div>' +
        '<div class="card"><h2 style="margin-bottom:8px">Skenario demonstrasi</h2><p class="body" style="margin-bottom:12px">Jalankan dari tombol Panel demo di pojok kanan bawah.</p><div class="table-wrap"><table class="t"><thead><tr><th>Skenario</th><th>Langkah</th></tr></thead><tbody>' +
        dua('<b>1. Pemulihan</b>', 'Anggota melihat status Waspada September (likuiditas dan kualitas aset kuning). Pengurus beralih luring, mencatat angsuran PJ-04 dan PJ-06 yang menunggak, lalu sinkron. Pratinjau Oktober berubah dari Perlu tindakan menjadi Sehat. Tutup buku, pengawas mengesahkan.') +
        dua('<b>2. RAT</b>', 'Pengurus menerbitkan paket (terkunci hash). Anggota membaca paket. Pengurus memulai RAT; anggota memasukkan kode hadir (kode salah ditolak) dan memberi tiga suara. Pengurus menutup RAT; berita acara terbentuk.') +
        dua('<b>3. Dinas</b>', 'Dinas membuka 30 koperasi, papan KPI, lalu menekan Hitung ulang pada Sukamaju. Hasilnya sama dengan semua periode tersimpan.') +
        dua('<b>4. Perlu tindakan</b>', 'Pengurus mencatat penarikan sukarela Rp1,5 juta dan beban Rp12 juta lalu tutup buku. Status Perlu tindakan, tiket Tindak lanjut bertenggat 14 hari, ringkasannya tampil di beranda anggota.') +
        dua('<b>5. Keutuhan</b>', 'Panel demo mengubah satu entri tanpa menghitung ulang hash. Periksa keutuhan menunjuk entri itu sebagai yang pertama tidak cocok; tombol pulihkan mengembalikan rantai.') +
        '</tbody></table></div></div>' +
        '<div class="card tint"><h2 style="margin-bottom:8px">Batas klaim keamanan</h2><p class="body">Rantai hash membuat perubahan diam-diam terdeteksi, tetapi tidak mencegah pihak yang menguasai server menulis ulang seluruh rantai. Karena itu pengawas dan dinas dapat menjalankan pemeriksaan keutuhan sendiri, dan paket RAT dikunci dengan hash. Ini penanda keutuhan, bukan blockchain dan bukan jaminan keamanan mutlak.</p></div>' +
        '<p><a class="btn outline" href="#/depan">' + icon('home') + 'Buka halaman depan publik</a></p>' +
        '<p class="small mute">Kerangka acuan: Evans, E., &amp; Branch, B. (2002). Technical guide: PEARLS performance monitoring system. World Council of Credit Unions. Pelindungan data pribadi mengacu UU Nomor 27 Tahun 2022. Seluruh ambang dan bobot adalah ambang awal simulasi.</p></div>';
    }
  };
})();
