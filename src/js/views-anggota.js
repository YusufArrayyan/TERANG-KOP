/* TERANG-KOP — layar Anggota. Anggota hanya melihat data dirinya dan angka agregat koperasi. */
(function () {
  'use strict';
  var App = window.App, TK = window.TK, esc = App.esc, icon = App.icon, rp = App.rp, tgl = App.tgl;

  function aku() { return App.anggota(App.session.anggota_id) || App.state.anggota[3]; }
  function catatBuka(id) {
    var s = App.state, hari = App.today();
    if (!s.logRingkasan.some(function (l) { return l.anggota_id === id && l.tanggal === hari; })) {
      s.logRingkasan.push({ anggota_id: id, tanggal: hari });
      App.save();
    }
  }
  function pinjamanSaya(id) {
    return App.state.pinjaman.filter(function (p) { return p.anggota_id === id; }).map(function (p) {
      var st = TK.statusPinjaman(App.state, p, App.today()); st.p = p; return st;
    }).filter(function (x) { return x; });
  }
  function badgePinjaman(st) {
    var m = { 'Lancar': ['sehat', 'check'], 'Terlambat': ['waspada', 'clock'], 'Menunggak': ['tindakan', 'alert'], 'Lunas': ['netral', 'checkCircle'] }[st.status];
    var label = st.status + (st.status === 'Terlambat' || st.status === 'Menunggak' ? ' ' + st.hari_tunggak + ' hari' : '');
    return '<span class="status ' + m[0] + '">' + icon(m[1], 'sm') + label + '</span>';
  }
  App.ui.badgePinjaman = badgePinjaman;
  App.ui.estimasiSHU = function (id, pid) {
    var s = App.state, sampai = TK.tgl.akhirPeriode(pid);
    var lr = TK.labaRugi(s.entri, pid.slice(0, 4) + '-01-01', sampai);
    var milik = TK.saldoAnggota(s, id, sampai);
    var total = 0;
    s.anggota.forEach(function (a) { var x = TK.saldoAnggota(s, a.id, sampai); total += x.pokok + x.wajib; });
    var bagian = Math.max(0, lr.shu) * 0.7;
    return { nilai: total ? Math.round(bagian * (milik.pokok + milik.wajib) / total) : 0, surplus: lr.shu, sampai: sampai };
  };

  /* ---------- Beranda ---------- */
  App.views['ang/beranda'] = {
    title: 'Beranda',
    render: function () {
      var s = App.state, a = aku();
      catatBuka(a.id);
      var sal = TK.saldoAnggota(s, a.id);
      var pj = pinjamanSaya(a.id).filter(function (x) { return x.status !== 'Lunas'; });
      var pt = App.periodeTerbitTerakhir();
      var sk = pt ? App.skorDetail(pt.id) : null;
      var tl = App.tiketKop(s.koperasi.id).filter(function (t) { return t.jenis === 'Tindak lanjut' && t.status !== 'Selesai'; });
      var tlHtml = tl.map(function (t) {
        return '<div class="callout bad">' + icon('octagon') + '<div class="grow stack sm"><p><b>Koperasi Anda berstatus Perlu tindakan untuk ' + TK.namaPeriode(t.periode_id) + '.</b> Pengurus wajib menindaklanjuti dan menjelaskan langkahnya paling lambat ' + App.tglPanjang(t.tenggat) + '.</p>' +
          (t.penjelasan ? '<p><b>Penjelasan pengurus:</b> ' + esc(t.penjelasan) + '</p>' : '<p class="small">Penjelasan tertulis dari pengurus belum dibagikan. Status tiket: ' + esc(t.status) + (App.terlambat(t) ? ', terlambat' : '') + '.</p>') + '</div></div>';
      }).join('');
      var pinjHtml = pj.length ? pj.map(function (st) {
        return '<div class="row between"><span class="mid">' + rp(st.sisa) + '</span>' + badgePinjaman(st) + '</div><p class="small body">Sisa pokok pinjaman ' + st.p.id + '.' +
          (st.tunggakan.length ? ' Ada ' + st.tunggakan.length + ' angsuran tertunggak sejak ' + tgl(st.tunggakan[0].jatuh_tempo) + '.' : '') +
          (st.berikut ? ' Angsuran berikutnya ' + rp(st.berikut.total) + ', jatuh tempo ' + tgl(st.berikut.jatuh_tempo) + '.' : '') + '</p>';
      }).join('<hr class="div">') : '<p class="mid">Rp0</p><p class="small body">Anda tidak punya pinjaman berjalan.</p>';
      var shu = pt ? App.ui.estimasiSHU(a.id, pt.id) : null;
      return App.pageHead('Halo, ' + App.namaDepan(a.nama), 'Ini ringkasan simpanan dan kondisi koperasi Anda per ' + App.tglPanjang(App.today()) + '.') +
        '<div class="stack">' + tlHtml +
        '<div class="grid g2"><section class="card hero-card" aria-labelledby="h-simp"><div class="row between top"><h2 id="h-simp">Simpanan Anda</h2>' + (sk ? App.statusBadge(sk.status) : '') + '</div><p class="hero-num">' + rp(sal.total) + '</p>' +
        '<div class="kv"><div><span class="label">Pokok</span><b>' + rp(sal.pokok) + '</b></div><div><span class="label">Wajib</span><b>' + rp(sal.wajib) + '</b></div><div><span class="label">Sukarela</span><b>' + rp(sal.sukarela) + '</b></div></div>' +
        '<p class="hero-note">Nomor anggota ' + a.no + ' · ' + esc(s.koperasi.nama) + '</p></section>' +
        '<section class="card stack sm" aria-labelledby="h-pinj"><h2 id="h-pinj">Pinjaman Anda</h2>' + pinjHtml + '</section></div>' +
        (sk ? App.ui.ringkasSkor(sk, 'Kesehatan koperasi, ' + TK.namaPeriode(pt.id), '<a class="btn outline sm" href="' + App.href('koperasi') + '">Lihat rincian skor</a>') : '') +
        (shu ? '<section class="card" aria-labelledby="h-shu"><h2 id="h-shu">Perkiraan SHU Anda</h2><p class="u-m-3-0 mid">' + rp(shu.nilai) + '</p>' +
          '<p class="small body">Perkiraan bagian anggota 70% dari SHU ' + rp(shu.surplus) + ' per ' + tgl(shu.sampai) + ', dibagi menurut simpanan pokok dan wajib. Angka final ditetapkan RAT.</p></section>' : '') +
        '<div class="row"><a class="btn outline" href="' + App.href('cetak') + '">' + icon('print') + 'Lihat ringkasan cetak</a><a class="btn outline" href="' + App.href('riwayat') + '">' + icon('list') + 'Lihat riwayat transaksi</a></div>' +
        '</div>';
    }
  };

  /* ---------- Riwayat ---------- */
  function arahAnggota(e) {
    var map = { T01: 1, T02: 1, T03: 1, T04: -1, T05: 1, T06: -1 };
    return map[e.jenis] || (e.jenis === 'T13' ? 0 : 0);
  }
  App.views['ang/riwayat'] = {
    title: 'Riwayat',
    render: function (r) {
      var s = App.state, a = aku();
      var f = (r.q && r.q.f) || 'semua';
      var milik = s.entri.filter(function (e) { return e.anggota_id === a.id; });
      var list = milik.filter(function (e) {
        if (f === 'simpanan') return ['T01', 'T02', 'T03', 'T04'].indexOf(e.jenis) >= 0;
        if (f === 'pinjaman') return ['T05', 'T06'].indexOf(e.jenis) >= 0;
        return true;
      }).slice().reverse();
      var antre = (s.antrean || []).filter(function (q) { return q.draft.anggota_id === a.id; });
      var seg = [['semua', 'Semua'], ['simpanan', 'Simpanan'], ['pinjaman', 'Pinjaman']].map(function (x) {
        return '<a class="btn sm ' + (f === x[0] ? 'dark' : 'secondary') + '" href="' + App.href('riwayat') + '?f=' + x[0] + '"' + (f === x[0] ? ' aria-current="true"' : '') + '>' + x[1] + '</a>';
      }).join('');
      var rows = list.map(function (e) {
        var n = App.ui.nominalEntri(e), arah = arahAnggota(e);
        var ket = e.jenis === 'T05' ? 'Pinjaman diterima' : e.jenis === 'T06' ? 'Angsuran dibayar' : e.jenis === 'T04' ? 'Penarikan' : 'Setoran';
        return '<div class="li"><div class="grow"><b>' + esc(e.uraian) + '</b><div class="small mute">' + tgl(e.tanggal) + ' · ' + ket + ' · ' + e.id + '</div></div><span class="amt' + (arah > 0 && e.jenis !== 'T05' ? ' plus' : '') + '">' + (arah > 0 && e.jenis !== 'T05' ? '+' : '') + rp(n) + '</span></div>';
      }).join('');
      var pj = pinjamanSaya(a.id);
      var jadwal = pj.map(function (st) {
        return '<div class="card flat"><div class="card-head"><h3>' + st.p.id + ' · ' + rp(st.p.pokok) + ', ' + st.p.tenor + ' bulan, jasa ' + String(st.p.jasa_persen).replace('.', ',') + '% per bulan</h3>' + badgePinjaman(st) + '</div>' +
          '<div class="table-wrap"><table class="t"><thead><tr><th>Ke</th><th>Jatuh tempo</th><th class="r">Pokok</th><th class="r">Jasa</th><th class="r">Jumlah</th><th>Status</th></tr></thead><tbody>' +
          st.jadwal.map(function (j, i) {
            var kum = st.jadwal.slice(0, i + 1).reduce(function (x, y) { return x + y.pokok; }, 0);
            var lunas = st.dibayar >= kum;
            var lewat = j.jatuh_tempo <= App.today();
            return '<tr><td>' + j.ke + '</td><td class="num">' + tgl(j.jatuh_tempo) + '</td><td class="r">' + rp(j.pokok) + '</td><td class="r">' + rp(j.jasa) + '</td><td class="r strong">' + rp(j.total) + '</td><td>' +
              (lunas ? '<span class="ind hijau">' + icon('check', 'sm') + 'Dibayar</span>' : lewat ? '<span class="ind merah">' + icon('alert', 'sm') + 'Tertunggak</span>' : '<span class="small mute">Belum jatuh tempo</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div></div>';
      }).join('');
      var audit = s.audit.filter(function (x) { return x.anggota_id === a.id; }).slice(-8).reverse();
      return App.pageHead('Riwayat', 'Semua transaksi atas nama Anda, jadwal angsuran, dan data pribadi yang disimpan.') +
        '<div class="stack lg"><section class="card"><div class="card-head"><h2>Transaksi</h2><div class="row" role="group" aria-label="Saring transaksi">' + seg + '</div></div>' +
        (antre.length ? App.callout('warn', 'clock', '<p>' + antre.length + ' transaksi atas nama Anda dicatat pengurus saat luring dan masih menunggu sinkron.</p>') : '') +
        (rows ? '<div class="list">' + rows + '</div>' : App.empty('list', 'Belum ada transaksi', 'Transaksi muncul di sini setelah pengurus mencatat setoran atau angsuran atas nama Anda.')) + '</section>' +
        (jadwal ? '<section class="stack"><h2>Jadwal angsuran</h2>' + jadwal + '</section>' : '') +
        '<section class="card" aria-labelledby="h-pdp"><h2 id="h-pdp">Data pribadi Anda</h2><p class="u-m-2-4 body">Koperasi hanya menyimpan data minimal: nama, nomor anggota, dan nomor ponsel bila Anda memberikannya. Nomor KTP tidak disimpan.</p>' +
        '<dl class="dl"><dt>Nama</dt><dd>' + esc(a.nama) + '</dd><dt>Nomor anggota</dt><dd>' + a.no + '</dd><dt>Nomor ponsel</dt><dd>Tidak diberikan</dd><dt>Persetujuan</dt><dd>' +
        (a.persetujuan_pdp ? 'Diberikan ' + App.tglPanjang(a.persetujuan_pdp) + ' sesuai UU Nomor 27 Tahun 2022' : '<span class="ind merah">' + icon('x', 'sm') + 'Dicabut</span>') + '</dd></dl>' +
        '<div class="u-mt-4 row"><button class="btn outline sm" data-act="pdp-unduh">' + icon('download') + 'Unduh salinan data saya</button>' +
        (a.persetujuan_pdp ? '<button class="btn ghost sm" data-act="pdp-cabut">Cabut persetujuan</button>' : '<button class="btn ghost sm" data-act="pdp-beri">Berikan persetujuan lagi</button>') + '</div>' +
        '<h3 class="u-m-5-2">Siapa yang membuka data Anda</h3><p class="u-mb-2 small mute">Setiap akses oleh peran selain anggota tercatat di log audit.</p>' +
        (audit.length ? '<div class="list">' + audit.map(function (x) { return '<div class="li"><span class="ic">' + icon('eye', 'sm') + '</span><div class="grow"><b class="small">' + esc(x.nama) + '</b><div class="small mute">' + esc(x.aksi) + ' · ' + tgl(x.tanggal) + '</div></div></div>'; }).join('') + '</div>' : '<p class="body">Belum ada akses tercatat.</p>') +
        '</section></div>';
    }
  };
  App.acts['pdp-unduh'] = function () {
    var a = aku(), s = App.state;
    var data = { anggota: { nama: a.nama, nomor_anggota: a.no, persetujuan_pdp: a.persetujuan_pdp }, saldo: TK.saldoAnggota(s, a.id),
      transaksi: s.entri.filter(function (e) { return e.anggota_id === a.id; }).map(function (e) { return { id: e.id, tanggal: e.tanggal, jenis: e.jenis, uraian: e.uraian, nominal: App.ui.nominalEntri(e) }; }),
      log_akses: s.audit.filter(function (x) { return x.anggota_id === a.id; }), catatan: 'Data simulasi TERANG-KOP.' };
    App.unduh('data-saya-' + a.no + '.json', JSON.stringify(data, null, 2));
  };
  App.acts['pdp-cabut'] = function () {
    App.confirm({ judul: 'Cabut persetujuan data pribadi?', tombol: 'Cabut persetujuan', bahaya: true,
      isi: '<p>Pengurus akan diminta menghentikan pengolahan data pribadi Anda di luar kewajiban pembukuan koperasi. Catatan simpanan dan pinjaman tetap disimpan karena diwajibkan untuk pembukuan.</p><p class="small">Di prototipe, pencabutan hanya mengubah tanda persetujuan.</p>' }).then(function (ok) {
      if (!ok) return; aku().persetujuan_pdp = null; App.save(); App.toast('Persetujuan dicabut.'); App.render();
    });
  };
  App.acts['pdp-beri'] = function () { aku().persetujuan_pdp = App.today(); App.save(); App.toast('Persetujuan diberikan.'); App.render(); };

  /* ---------- Koperasi (laporan dan skor) ---------- */
  App.views['ang/koperasi'] = {
    title: 'Koperasi',
    render: function () {
      var s = App.state;
      var terbit = s.periode.filter(function (p) { return p.status === 'Terbit'; });
      if (!terbit.length) return App.pageHead('Koperasi') + App.empty('shield', 'Belum ada laporan terbit', 'Laporan bulanan muncul di sini setelah disahkan pengawas.');
      var pt = terbit[terbit.length - 1];
      var sk = App.skorDetail(pt.id);
      var hist = terbit.map(function (p) { var r = s.skor.filter(function (x) { return x.periode_id === p.id; })[0]; return { periode: p.id, nilai: r.nilai, status: r.status }; });
      return App.pageHead('Laporan dan skor koperasi', esc(s.koperasi.nama) + '. Laporan ' + TK.namaPeriode(pt.id) + ' disahkan pengawas pada ' + App.tglPanjang(pt.disahkan_pada) + '.') +
        '<div class="stack lg">' + App.ui.ringkasSkor(sk, 'Skor ' + TK.namaPeriode(pt.id)) +
        '<section class="card"><div class="card-head"><h2>Rincian tujuh indikator</h2><a class="btn ghost sm" href="' + App.href('cara-skor') + '">' + icon('calc') + 'Cara skor dihitung</a></div>' + App.ui.tabelIndikator(sk) + '</section>' +
        '<section class="card"><h2 class="u-mb-1">Riwayat skor</h2><p class="u-mb-2 small mute">Bulan bergaris adalah masa kalibrasi.</p>' + App.ui.histori(hist) + '</section>' +
        '<section class="stack"><h2>Laporan keuangan ' + TK.namaPeriode(pt.id) + '</h2>' + App.ui.laporan(pt.id) + '</section>' +
        '<p class="small mute">Skor adalah peringatan dini agar pengurus, pengawas, anggota, dan dinas bertindak lebih awal. Skor bukan penilaian hukum.</p></div>';
    }
  };

  /* ---------- RAT ---------- */
  App.views['ang/rat'] = {
    title: 'RAT',
    render: function () {
      var s = App.state, rat = s.rat, a = aku();
      var hMin = TK.tgl.diffDays(rat.tanggal, App.today());
      var head = App.pageHead('Rapat Anggota Tahunan', 'RAT ' + App.tglPanjang(rat.tanggal) + '. e-RAT melengkapi rapat tatap muka dan tidak menggantikannya.');
      var status = '<div class="card"><div class="row between"><div><span class="label">Status</span><p class="u-mt-1 mid">' + esc(rat.status) + '</p></div>' +
        '<div class="row">' + (rat.status === 'Dijadwalkan' ? App.chip(hMin > 0 ? hMin + ' hari lagi' : 'Hari ini', 'amber', 'calendar') : '') + '</div></div>' +
        (rat.status === 'Dijadwalkan' ? '<p class="u-mt-3 body">Paket laporan akan dibagikan paling lambat ' + App.tglPanjang(TK.tgl.addDays(rat.tanggal, -7)) + ' (H-7). Setelah terbit, paket dikunci dan tidak dapat diubah.</p>' : '') + '</div>';
      if (!rat.paket) {
        var tahap = [['Dijadwalkan', 'Tanggal dan agenda sudah ditetapkan.'], ['Paket terbit', 'Laporan dibagikan paling lambat ' + App.tglPanjang(TK.tgl.addDays(rat.tanggal, -7)) + '.'], ['Berlangsung', 'Hari RAT: isi daftar hadir dengan kode, lalu beri suara.'], ['Selesai', 'Berita acara terbentuk dari daftar hadir dan hasil suara.']];
        return head + '<div class="stack lg">' + status +
          '<div class="grid g2"><section class="card" aria-labelledby="h-agenda"><h2 id="h-agenda" class="u-mb-3">Agenda yang akan diputuskan</h2><ol class="u-list stack sm body">' +
          rat.agenda.map(function (ag) { return '<li>' + esc(ag.judul) + '</li>'; }).join('') + '</ol></section>' +
          '<section class="card" aria-labelledby="h-tahap"><h2 id="h-tahap" class="u-mb-3">Tahapan RAT</h2><div class="tasks">' +
          tahap.map(function (t, i) { return '<div class="task' + (i === 0 ? ' attn' : '') + '"><span class="ic">' + icon(i === 0 ? 'clock' : 'more') + '</span><span class="grow"><b>' + t[0] + '</b><span class="small body">' + esc(t[1]) + '</span></span></div>'; }).join('') +
          '</div></section></div>' +
          '<p class="small body">Sambil menunggu paket, Anda bisa membaca laporan bulanan dan skor koperasi di halaman <a href="' + App.href('koperasi') + '">Koperasi</a>.</p></div>';
      }
      var dibaca = rat.dibaca[a.id];
      var paket = '<section class="card"><div class="card-head"><h2>Paket laporan RAT</h2>' + (dibaca ? App.chip('Dibaca ' + tgl(dibaca), '', 'check') : App.chip('Belum dibaca', 'amber')) + '</div>' +
        '<p class="body">Terbit ' + App.tglPanjang(rat.paket.terbit_pada) + ' (H-' + rat.paket.h_minus + '), dikunci sehingga isinya tidak bisa diubah lagi. Sidik jari digital: <span class="hash">' + App.pendek(rat.paket.hash, 12) + '</span>.</p>' +
        '<div class="u-mt-4 row"><button class="btn ' + (dibaca ? 'outline' : 'primary') + '" data-act="baca-paket">' + icon('book') + (dibaca ? 'Baca lagi paket RAT' : 'Baca paket RAT') + '</button></div></section>';
      var hadir = rat.kehadiran.some(function (k) { return k.anggota_id === a.id; });
      var kuo = TK.kuorumRAT(s);
      var hari = '';
      if (rat.status === 'Berlangsung') {
        hari = '<section class="card stack"><h2>Hari RAT</h2>' +
          (hadir ? App.callout('ok', 'checkCircle', '<p>Kehadiran Anda tercatat.</p>') :
            '<form class="stack" data-form="hadir" novalidate><div class="field"><label for="kode">Kode hadir</label><input class="u-code-input input mono" id="kode" name="kode" inputmode="numeric" maxlength="4" autocomplete="off" spellcheck="false" placeholder="Contoh: 1234…" aria-describedby="kode-h"><span class="hint" id="kode-h">Kode empat angka ditampilkan pengurus di tempat rapat.</span><span class="err" id="kode-err" role="alert"></span></div><div><button class="btn primary" type="submit">Catat kehadiran saya</button></div></form>') +
          '<p class="small body">Hadir ' + kuo.hadir + ' dari ' + kuo.anggota + ' anggota. Kuorum ' + (kuo.tercapai ? 'tercapai.' : 'belum tercapai; perlu ' + kuo.perlu + ' anggota.') + '</p>' +
          (hadir ? '<div class="stack">' + rat.agenda.map(function (ag, i) {
            var su = rat.suara.filter(function (x) { return x.agenda_id === ag.id && x.anggota_id === a.id; })[0];
            return '<div class="card flat stack sm"><span class="label">Agenda ' + (i + 1) + '</span><h3>' + esc(ag.judul) + '</h3>' +
              (su ? '<p class="ind hijau">' + icon('lock', 'sm') + 'Suara Anda: ' + esc(su.pilihan) + ' · tercatat dan tidak dapat diubah</p>' :
                '<div class="row" role="group" aria-label="Pilihan untuk agenda ' + (i + 1) + '">' + ['Setuju', 'Tidak setuju', 'Abstain'].map(function (p) {
                  return '<button class="btn ' + (p === 'Setuju' ? 'primary' : 'outline') + ' sm" data-act="suara" data-ag="' + ag.id + '" data-p="' + p + '"' + (kuo.tercapai ? '' : ' disabled') + '>' + p + '</button>';
                }).join('') + '</div>' + (kuo.tercapai ? '' : '<p class="small mute">Suara dibuka setelah kuorum tercapai.</p>')) + '</div>';
          }).join('') + '</div>' : '') + '</section>';
      }
      var ba = rat.berita_acara ? App.ui.beritaAcara(rat.berita_acara) : '';
      return head + '<div class="stack lg">' + status + paket + hari + ba + '</div>';
    }
  };
  App.ui.isiPaket = function (rat) {
    var p = rat.paket.isi, nr = p.neraca, lr = p.laba_rugi;
    return '<p class="body">Laporan sampai ' + TK.namaPeriode(p.sampai_periode) + '. Skor terakhir ' + (p.skor ? p.skor.nilai + ', ' + esc(p.skor.status) : '—') + '.</p>' +
      '<table class="t"><tbody><tr><td>Jumlah aset</td><td class="r strong">' + rp(nr.aset) + '</td></tr><tr><td>Simpanan anggota (pokok, wajib, sukarela)</td><td class="r">' + rp(nr.pokok + nr.wajib + nr.sukarela) + '</td></tr>' +
      '<tr><td>Utang bank</td><td class="r">' + rp(nr.utangBank) + '</td></tr><tr><td>Pendapatan tahun berjalan</td><td class="r">' + rp(lr.pendapatan) + '</td></tr><tr><td>Beban tahun berjalan</td><td class="r">' + rp(lr.beban) + '</td></tr>' +
      '<tr><td><b>SHU tahun berjalan</b></td><td class="r strong">' + rp(lr.shu) + '</td></tr><tr><td>Usulan bagian anggota (70%)</td><td class="r">' + rp(Math.round(lr.shu * 0.7)) + '</td></tr><tr><td>Usulan cadangan (30%)</td><td class="r">' + rp(lr.shu - Math.round(lr.shu * 0.7)) + '</td></tr></tbody></table>' +
      '<h3>Agenda</h3><ol class="u-list body">' + p.agenda.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<p class="small mute">Sidik jari digital paket <span class="hash">' + esc(rat.paket.hash) + '</span>. ' + (TK.periksaPaket(rat) ? 'Isinya cocok dengan sidik jari, jadi paket tidak berubah sejak terbit.' : 'Isinya tidak cocok dengan sidik jari. Laporkan kepada pengawas.') + '</p>';
  };
  App.acts['baca-paket'] = function () {
    var s = App.state, a = aku();
    if (!s.rat.dibaca[a.id]) { s.rat.dibaca[a.id] = App.today(); App.save(); }
    App.modal('Paket laporan RAT', App.ui.isiPaket(s.rat));
    var d = document.getElementById('dlg'); var once = function () { d.removeEventListener('close', once); App._focusNext = false; App.render(); App._focusNext = true; }; d.addEventListener('close', once);
  };
  App.forms.hadir = function (f) {
    var kode = f.kode.value.trim(), err = document.getElementById('kode-err');
    var r = TK.catatHadir(App.state, aku().id, kode);
    if (!r.ok) { err.innerHTML = icon('alert', 'sm') + '<span>' + esc(r.pesan) + '</span>'; f.kode.setAttribute('aria-invalid', 'true'); f.kode.focus(); return; }
    App.save(); App.toast('Kehadiran tercatat.'); App.render();
  };
  App.acts.suara = function (el) {
    var ag = el.getAttribute('data-ag'), p = el.getAttribute('data-p');
    var agenda = App.state.rat.agenda.filter(function (x) { return x.id === ag; })[0];
    App.confirm({ judul: 'Kirim suara "' + p + '"?', tombol: 'Kirim suara ' + p, isi: '<p>' + esc(agenda.judul) + '</p><p class="small">Satu anggota satu suara. Suara tidak dapat diubah setelah dikirim.</p>' }).then(function (ok) {
      if (!ok) return;
      var r = TK.kirimSuara(App.state, ag, aku().id, p);
      if (!r.ok) { App.toast(r.pesan, 'bad'); return; }
      App.save(); App.toast('Suara tercatat.'); App._focusNext = false; App.render(); App._focusNext = true;
    });
  };
  App.ui.beritaAcara = function (ba) {
    return '<section class="card"><div class="card-head"><h2>Berita acara RAT</h2>' + App.chip('Terbentuk otomatis', '', 'check') + '</div>' +
      '<dl class="dl"><dt>Tanggal RAT</dt><dd>' + App.tglPanjang(ba.tanggal_rat) + '</dd><dt>Dibuat</dt><dd>' + App.tglPanjang(ba.dibuat_pada) + '</dd><dt>Kehadiran</dt><dd>' + ba.kuorum.hadir + ' dari ' + ba.kuorum.anggota + ' anggota; kuorum ' + (ba.kuorum.tercapai ? 'tercapai' : 'tidak tercapai') + '</dd>' +
      '<dt>Sidik jari paket</dt><dd class="hash">' + App.pendek(ba.paket_hash, 16) + '</dd></dl>' +
      '<div class="u-mt-4 table-wrap"><table class="t"><thead><tr><th>Agenda</th><th class="r">Setuju</th><th class="r">Tidak</th><th class="r">Abstain</th><th>Hasil</th></tr></thead><tbody>' +
      ba.rekap.map(function (x) { return '<tr><td>' + esc(x.judul) + '</td><td class="r">' + x.rekap.Setuju + '</td><td class="r">' + x.rekap['Tidak setuju'] + '</td><td class="r">' + x.rekap.Abstain + '</td><td>' + (x.hasil === 'Diterima' ? '<span class="ind hijau">' + icon('check', 'sm') + 'Diterima</span>' : '<span class="ind merah">' + icon('x', 'sm') + esc(x.hasil) + '</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="u-mt-3 small mute">Sidik jari digital berita acara <span class="hash">' + App.pendek(ba.hash, 16) + '</span></p></section>';
  };

  /* ---------- Ringkasan cetak A5 ---------- */
  App.ui.lembarA5 = function (id) {
    var s = App.state, a = App.anggota(id), sal = TK.saldoAnggota(s, id);
    var pt = App.periodeTerbitTerakhir();
    var rec = pt ? s.skor.filter(function (x) { return x.periode_id === pt.id; })[0] : null;
    var pj = pinjamanSaya(id).filter(function (x) { return x.status !== 'Lunas'; });
    var shu = pt ? App.ui.estimasiSHU(id, pt.id) : null;
    var akhir = s.entri.filter(function (e) { return e.anggota_id === id; }).slice(-4).reverse();
    return '<article class="a5" aria-label="Lembar ringkasan A5 untuk ' + esc(a.nama) + '"><div class="a5-head">' + App.LOGO + '<div><h3>Ringkasan anggota · ' + esc(s.koperasi.nama) + '</h3><div>' + esc(a.nama) + ' · ' + a.no + ' · per ' + tgl(App.today()) + '</div></div></div>' +
      '<table><tbody><tr><td>Simpanan pokok</td><td class="r">' + rp(sal.pokok) + '</td></tr><tr><td>Simpanan wajib</td><td class="r">' + rp(sal.wajib) + '</td></tr><tr><td>Simpanan sukarela</td><td class="r">' + rp(sal.sukarela) + '</td></tr><tr><td><b>Jumlah simpanan</b></td><td class="r">' + rp(sal.total) + '</td></tr>' +
      pj.map(function (st) { return '<tr><td>Sisa pinjaman ' + st.p.id + ' (' + st.status + ')</td><td class="r">' + rp(st.sisa) + '</td></tr>' + (st.berikut ? '<tr><td>Angsuran berikutnya, ' + tgl(st.berikut.jatuh_tempo) + '</td><td class="r">' + rp(st.berikut.total) + '</td></tr>' : ''); }).join('') +
      (shu ? '<tr><td>Perkiraan SHU (final ditetapkan RAT)</td><td class="r">' + rp(shu.nilai) + '</td></tr>' : '') + '</tbody></table>' +
      (rec ? '<div><b>Kesehatan koperasi ' + TK.namaPeriode(pt.id) + ':</b> skor ' + rec.nilai + ', ' + esc(rec.status) + '. Skor adalah peringatan dini, bukan penilaian hukum.</div>' : '') +
      '<div><b>Transaksi terakhir</b><table><tbody>' + akhir.map(function (e) { return '<tr><td>' + tgl(e.tanggal) + ' · ' + esc(e.uraian) + '</td><td class="r">' + rp(App.ui.nominalEntri(e)) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="foot">Lembar untuk pertemuan bulanan. Data simulasi prototipe TERANG-KOP. Tanyakan angka yang tidak Anda kenali kepada pengurus atau pengawas.</div></article>';
  };
  App.views['ang/cetak'] = {
    title: 'Ringkasan cetak',
    render: function () {
      var a = aku();
      return App.pageHead('Ringkasan cetak', 'Satu lembar A5 untuk pertemuan bulanan, bagi anggota yang tidak membuka aplikasi.', '<button class="btn primary" data-act="cetak">' + icon('print') + 'Cetak ringkasan</button>') +
        App.ui.lembarA5(a.id);
    }
  };
  App.acts.cetak = function () { App.toast('Prototipe: dialog cetak tidak dibuka. Di produk sesungguhnya lembar ini dicetak ukuran A5.'); };
})();
