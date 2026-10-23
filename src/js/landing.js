/* TERANG-KOP — halaman depan publik.
 * Setiap potongan antarmuka di halaman ini dihitung oleh mesin yang sama dengan aplikasi,
 * dari salinan data simulasi Kopdes Sukamaju, sehingga angka di sini sama dengan angka di dalam prototipe. */
(function () {
  'use strict';
  var App = window.App, TK = window.TK, SEED = window.SEED, esc = App.esc, icon = App.icon, rp = App.rp, tgl = App.tgl;

  /* ---------- Data: salinan seed, tidak menyentuh App.state ---------- */
  var D = null;
  function salin(o) { return JSON.parse(JSON.stringify(o)); }
  function tagih(s, pid) {
    var p = s.pinjaman.filter(function (x) { return x.id === pid; })[0];
    var st = TK.statusPinjaman(s, p, s.tanggalSimulasi);
    var pokok = st.tunggakan.reduce(function (a, j) { return a + j.pokok; }, 0), jasa = st.tunggakan.reduce(function (a, j) { return a + j.jasa; }, 0);
    TK.tambahEntri(s, { tanggal: s.tanggalSimulasi, jenis: 'T06', anggota_id: p.anggota_id, pinjaman_id: pid, pokok: pokok, jasa: jasa, cid: 'lp-' + pid });
  }
  function data() {
    if (D) return D;
    var s = SEED.stateAwal(); delete s._galatSeed;
    var tunggak = ['PJ-04', 'PJ-06'].map(function (pid) {
      var p = s.pinjaman.filter(function (x) { return x.id === pid; })[0];
      var st = TK.statusPinjaman(s, p, s.tanggalSimulasi);
      return { id: pid, anggota: s.anggota.filter(function (a) { return a.id === p.anggota_id; })[0].nama, bulan: st.tunggakan.length,
        total: st.tunggakan.reduce(function (a, j) { return a + j.total; }, 0) };
    });
    var skor = {};
    [[], ['PJ-04'], ['PJ-06'], ['PJ-04', 'PJ-06']].forEach(function (set) {
      var c = salin(s); set.forEach(function (pid) { tagih(c, pid); });
      var pv = TK.pratinjauSkor(c, '2026-10', c.tanggalSimulasi);
      skor[set.join('+')] = { sk: pv.skor, n: c.entri.length, ujung: c.entri[c.entri.length - 1].hash };
    });
    // RAT disimulasikan pada salinan: paket, hadir 14 anggota, tiga suara, berita acara.
    var r = salin(s);
    TK.terbitkanPaket(r); TK.mulaiRAT(r);
    var pilih = ['Setuju', 'Setuju', 'Setuju', 'Tidak setuju', 'Setuju', 'Abstain', 'Setuju'];
    r.anggota.slice(0, 14).forEach(function (a, i) {
      TK.catatHadir(r, a.id, null);
    });
    r.rat.kehadiran.forEach(function (k, i) { r.rat.agenda.forEach(function (ag, j) { TK.kirimSuara(r, ag.id, k.anggota_id, pilih[(i + j) % pilih.length]); }); });
    TK.tutupRAT(r);
    D = { s: s, tunggak: tunggak, skor: skor, rat: r, sep: s.skor.filter(function (x) { return x.periode_id === '2026-09'; })[0] };
    return D;
  }

  /* ---------- Potongan: skor yang bisa dioperasikan ---------- */
  function fragSkor(set) {
    var d = data(), h = d.skor[set.join('+')], sk = h.sk;
    var rows = sk.indikator.map(function (i) {
      return '<li><span class="lp-code" aria-hidden="true">' + i.kode + '</span><span class="lp-iname">' + esc(i.nama) + '</span><span class="lp-ival num">' + esc(TK.fmtNilaiInd(i)) + '</span>' + App.indBadge(i.warna) + '</li>';
    }).join('');
    var cek = d.tunggak.map(function (t) {
      var on = set.indexOf(t.id) >= 0;
      return '<label class="lp-check"><input type="checkbox" data-lp-tagih="' + t.id + '"' + (on ? ' checked' : '') + '><span><b>Catat angsuran ' + t.id + '</b><span>' + esc(t.anggota) + ' · ' + t.bulan + ' angsuran tertunggak · ' + rp(t.total) + '</span></span></label>';
    }).join('');
    return '<div class="lp-frag-head"><div><b>Kopdes Merah Putih Sukamaju</b><span>Pratinjau skor Oktober 2026, per ' + tgl(d.s.tanggalSimulasi) + '</span></div></div>' +
      '<div class="lp-frag-score">' + App.gauge(sk.nilai, sk.status, true) + '<div class="stack sm">' + App.statusBadge(sk.status, true) +
      '<p class="lp-why">' + esc(sk.penurun.length ? 'Paling menurunkan skor: ' + sk.penurun.slice(0, 2).map(function (i) { return i.nama.toLowerCase(); }).join(' dan ') + '.' : 'Semua indikator hijau.') + (sk.jumlahMerah >= 2 ? ' Dua indikator merah, status Perlu tindakan.' : '') + '</p></div></div>' +
      '<ul class="lp-ind" aria-label="Tujuh indikator">' + rows + '</ul>' +
      '<fieldset class="lp-checks"><legend>Coba tagih peminjam yang menunggak</legend>' + cek + '</fieldset>' +
      '<p class="lp-readout" aria-live="polite">Dihitung ulang dari ' + h.n + ' catatan buku besar · sidik jari terakhir <span class="hash">' + App.pendek(h.ujung, 8) + '</span></p>';
  }

  /* ---------- Potongan: tiga keadaan "dari catatan ke peringatan" ---------- */
  function fragAlur() {
    var d = data(), s = d.s;
    var antre = [
      { u: 'Angsuran PJ-04 ke-4 sampai ke-6', m: 'Joko Susilo · T06', n: 981000 },
      { u: 'Setoran simpanan wajib Oktober', m: 'Siti Aminah · T02', n: 25000 }
    ].map(function (x) {
      return '<div class="lp-row"><div class="grow"><b>' + esc(x.u) + '</b><span>' + esc(x.m) + ' · ' + tgl(s.tanggalSimulasi) + '</span></div><span class="lp-amt num">' + rp(x.n) + '</span>' + App.chip('Menunggu sinkron', 'amber', 'clock') + '</div>';
    }).join('');
    var buku = s.entri.slice(-4).reverse().map(function (e) {
      return '<div class="lp-row"><span class="lp-eid num">' + e.id + '</span><div class="grow"><b>' + esc(e.uraian) + '</b><span class="hash">' + App.pendek(e.hash, 10) + '</span></div><span class="lp-amt num">' + rp(App.ui.nominalEntri(e)) + '</span></div>';
    }).join('');
    var sep = d.sep, tk = s.tiket.filter(function (t) { return t.koperasi_id === s.koperasi.id && t.periode_id === '2026-09'; })[0];
    return '<div class="lp-state" data-ui data-state="0"><div class="lp-frag-head"><div><b>Antrean luring</b><span>Ponsel bendahara, tanpa sinyal</span></div>' +
      '<span class="conn" data-online="false">' + icon('wifiOff') + 'Luring <span class="count">2</span></span></div>' + antre +
      '<p class="lp-note">Setiap catatan punya nomor unik, jadi kiriman ulang tidak tercatat dua kali.</p></div>' +
      '<div class="lp-state" data-ui data-state="1"><div class="lp-frag-head"><div><b>Buku besar</b><span>' + s.entri.length + ' catatan, tidak bisa diubah atau dihapus</span></div>' + App.chip('Rantai utuh', '', 'link') + '</div>' + buku +
      '<div class="lp-frag-score sm">' + App.gauge(sep.nilai, sep.status, true) + '<div class="stack sm"><b>Tutup buku September</b>' + App.statusBadge(sep.status) + '</div></div></div>' +
      '<div class="lp-state" data-ui data-state="2"><div class="lp-frag-head"><div><b>' + esc(tk.id) + ' · ' + esc(tk.jenis) + '</b><span>Untuk ' + esc(tk.pemilik_nama) + ', salinan ' + esc(tk.salinan.join(', ')) + '</span></div>' + App.chip(tk.status, 'amber') + '</div>' +
      '<p class="lp-ticket">' + esc(tk.ringkasan) + '</p><dl class="dl"><dt>Dibuat</dt><dd>' + App.tglPanjang(tk.dibuat) + '</dd><dt>Tenggat kontak</dt><dd>' + App.tglPanjang(tk.tenggat) + '</dd></dl>' +
      '<div class="lp-row note"><span class="avatar">DP</span><div class="grow"><b>Dimas Pratama (KJDP)</b><span>' + esc(tk.catatan[0].teks) + '</span></div></div></div>';
  }

  /* ---------- Lembar keluaran ---------- */
  var KELUAR = [['ringkasan', 'Ringkasan anggota'], ['laporan', 'Laporan bulanan'], ['paket', 'Paket RAT'], ['ba', 'Berita acara']];
  function lembar(jenis) {
    var d = data(), s = d.s;
    var kepala = function (judul, sub) { return '<div class="lp-sheet-head">' + App.LOGO + '<div><b>' + esc(judul) + '</b><span>' + esc(sub) + '</span></div></div>'; };
    var baris = function (l, v, b) { return '<tr' + (b ? ' class="tot"' : '') + '><td>' + l + '</td><td class="r num">' + v + '</td></tr>'; };
    if (jenis === 'ringkasan') {
      var sal = TK.saldoAnggota(s, 'A04');
      var pj = TK.statusPinjaman(s, s.pinjaman.filter(function (p) { return p.id === 'PJ-07'; })[0], s.tanggalSimulasi);
      return kepala('Ringkasan anggota · Kopdes Merah Putih Sukamaju', 'Siti Aminah · SKM-004 · per ' + tgl(s.tanggalSimulasi)) +
        '<table><tbody>' + baris('Simpanan pokok', rp(sal.pokok)) + baris('Simpanan wajib', rp(sal.wajib)) + baris('Simpanan sukarela', rp(sal.sukarela)) + baris('Jumlah simpanan', rp(sal.total), 1) +
        baris('Sisa pinjaman PJ-07 (' + pj.status + ')', rp(pj.sisa)) + baris('Angsuran berikutnya, ' + tgl(pj.berikut.jatuh_tempo), rp(pj.berikut.total)) + '</tbody></table>' +
        '<p><b>Kesehatan koperasi September 2026:</b> skor ' + d.sep.nilai + ', ' + esc(d.sep.status) + '. Skor adalah peringatan dini, bukan penilaian hukum.</p>' +
        '<p class="lp-sheet-foot">Lembar A5 untuk pertemuan bulanan, bagi anggota yang tidak membuka aplikasi.</p>';
    }
    if (jenis === 'laporan') {
      var nr = TK.neraca(s.entri, '2026-09-30', '2026-01-01'), lr = TK.labaRugi(s.entri, '2026-09-01', '2026-09-30');
      return kepala('Laporan bulanan September 2026', 'Disahkan pengawas ' + tgl(TK.cariPeriode(s, '2026-09').disahkan_pada) + ' · terbit sebelum tanggal 10') +
        '<table><tbody>' + baris('Kas dan bank', rp(nr.kas + nr.bank)) + baris('Piutang pinjaman anggota', rp(nr.piutang)) + baris('Penyisihan pinjaman bermasalah', rp(nr.penyisihan)) + baris('Jumlah aset', rp(nr.aset), 1) +
        baris('Simpanan sukarela', rp(nr.sukarela)) + baris('Utang bank', rp(nr.utangBank)) + baris('Modal anggota dan SHU', rp(nr.ekuitas)) + baris('Kewajiban dan ekuitas', rp(nr.kewajiban + nr.ekuitas), 1) + '</tbody></table>' +
        '<table><tbody>' + baris('Pendapatan September', rp(lr.pendapatan)) + baris('Beban September', rp(lr.beban)) + baris('SHU September', rp(lr.shu), 1) + '</tbody></table>' +
        '<p class="lp-sheet-foot">Neraca seimbang karena setiap entri berjurnal ganda: debit sama dengan kredit.</p>';
    }
    if (jenis === 'paket') {
      var p = d.rat.rat.paket;
      return kepala('Paket RAT 2026 · terkunci', 'Terbit ' + tgl(p.terbit_pada) + ', H-' + p.h_minus + ' dari RAT ' + tgl(d.rat.rat.tanggal)) +
        '<table><tbody>' + baris('SHU tahun berjalan sampai September', rp(p.isi.laba_rugi.shu), 1) + baris('Usulan bagian anggota (70%)', rp(Math.round(p.isi.laba_rugi.shu * 0.7))) + baris('Usulan cadangan (30%)', rp(p.isi.laba_rugi.shu - Math.round(p.isi.laba_rugi.shu * 0.7))) + '</tbody></table>' +
        '<ol>' + p.isi.agenda.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol>' +
        '<p class="lp-sheet-foot">Setelah terbit, isi paket dikunci dan tidak dapat diubah. Sidik jari paket <span class="hash">' + App.pendek(p.hash, 14) + '</span>.</p>';
    }
    var ba = d.rat.rat.berita_acara;
    return kepala('Berita acara RAT 2026', 'Terbentuk otomatis dari daftar hadir dan hasil suara') +
      '<p>Hadir ' + ba.kuorum.hadir + ' dari ' + ba.kuorum.anggota + ' anggota; kuorum ' + (ba.kuorum.tercapai ? 'tercapai' : 'tidak tercapai') + ' (perlu ' + ba.kuorum.perlu + ').</p>' +
      '<table><thead><tr><th>Agenda</th><th class="r">Setuju</th><th class="r">Tidak</th><th class="r">Abstain</th></tr></thead><tbody>' +
      ba.rekap.map(function (x) { return '<tr><td>' + esc(x.judul) + ' · <b>' + esc(x.hasil) + '</b></td><td class="r num">' + x.rekap.Setuju + '</td><td class="r num">' + x.rekap['Tidak setuju'] + '</td><td class="r num">' + x.rekap.Abstain + '</td></tr>'; }).join('') +
      '</tbody></table><p class="lp-sheet-foot">Satu anggota satu suara; suara tidak dapat diubah setelah dikirim. Sidik jari berita acara <span class="hash">' + App.pendek(ba.hash, 12) + '</span>.</p>';
  }

  /* ---------- Halaman ---------- */
  function foto(src, alt, w, h, cls, eager) {
    return '<img class="' + (cls || '') + '" src="' + src + '" alt="' + esc(alt) + '" width="' + w + '" height="' + h + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async">';
  }
  App.views.depan = {
    render: function () {
      var d = data();
      var langkah = [
        ['Catat sekali, bahkan tanpa sinyal.', 'Pengurus mencatat simpanan, angsuran, dan penjualan gerai di ponsel. Entri luring menunggu di antrean dan masuk buku besar saat sinyal kembali.'],
        ['Lalu buku besar menghitung skornya.', 'Saat tutup buku bulanan, sistem menghitung tujuh indikator kesehatan (adaptasi PEARLS) dari catatan yang sama. Setiap catatan dikunci dengan sidik jari digital, jadi perubahan diam-diam ketahuan.'],
        ['Bila skor turun, tiket bertenggat terbuka.', 'Status Waspada mewajibkan pendamping KJDP menghubungi pengurus dalam tujuh hari kerja. Status Perlu tindakan memberi pengurus 14 hari untuk menjelaskan langkah perbaikannya kepada anggota secara tertulis.']
      ];
      return '<div class="lp">' +
        '<header class="lp-hero" aria-labelledby="lp-h1">' +
        '<div class="lp-hero-text"><a class="lp-mark" href="#/" aria-label="TERANG-KOP">' + App.LOGO + '<b translate="no">TERANG-KOP</b></a>' +
        '<div class="lp-hero-copy"><h1 id="lp-h1"><span class="lp-line"><span>Angka koperasi desa,</span></span><span class="lp-line"><span>terbuka bagi anggota</span></span></h1>' +
        '<p class="lp-lead">TERANG-KOP adalah pembukuan Koperasi Desa Merah Putih. Pengurus mencatat transaksi di ponsel, bahkan tanpa sinyal. Setiap bulan anggota melihat saldonya dan skor kesehatan koperasi. Kalau skor turun, pengurus wajib menjelaskan langkahnya dalam 14 hari.</p>' +
        '<div class="row"><a class="btn lp-btn" href="#/masuk">Coba prototipe</a><button type="button" class="btn lp-ghost" data-act="lp-ke" data-to="lp-alur">Lihat cara kerjanya</button></div></div></div>' +
        '<div class="lp-hero-stage"><a class="lp-top-link" href="#/masuk">Masuk ke prototipe</a><div class="lp-frag" data-ui id="lp-skor">' + fragSkor([]) + '</div></div>' +
        '</header>' +

        '<main id="konten" class="lp-main">' +
        '<section class="lp-intro" aria-labelledby="lp-intro-h"><div class="lp-intro-text"><h2 id="lp-intro-h">Sekitar 21 anggota per koperasi</h2>' +
        '<p class="first">Lebih dari 80.000 desa membentuk Koperasi Desa/Kelurahan Merah Putih sejak Inpres Nomor 9 Tahun 2025, dengan anggota melampaui 1,7 juta orang pada Januari 2026. Dibagi rata, satu koperasi hanya beranggotakan sekitar 21 orang.</p>' +
        '<p>Kepemilikan setipis itu membuat pengawasan oleh anggota sulit berjalan dengan sendirinya. Jumlah koperasi aktif turun dari 209.448 unit pada 2014 menjadi 130.119 pada akhir 2023, dan hanya 71,5% yang menggelar RAT.</p>' +
        '<p>Delapan koperasi bermasalah menimbulkan kerugian Rp26 triliun. Penjaminan simpanan bekerja setelah koperasi gagal. TERANG-KOP dirancang untuk bekerja sebelum itu: anggota melihat angka koperasinya tiap bulan, dan skor yang turun langsung membuka tugas bertenggat bagi pengurus atau pendamping.</p>' +
        '<p class="small body">Sumber: Revindo (2026); InvestorTrust.id (2026b); Rajagukguk (2025); Antara (2025). Rincian di esai COOPFEST 2026.</p></div>' +
        '<figure class="lp-intro-fig">' + foto('img/tugu.jpg', 'Tugu peringatan Kongres Koperasi di Tasikmalaya, lambang koperasi di atas alas hitam di antara pilar putih', 1100, 619) +
        '<figcaption>Tugu Kongres Koperasi pertama di Tasikmalaya. Gerakan koperasi Indonesia berumur hampir delapan puluh tahun.</figcaption></figure></section>' +

        '<section class="lp-alur" id="lp-alur" aria-labelledby="lp-alur-h"><div class="lp-alur-text"><h2 id="lp-alur-h">Dari catatan ke peringatan</h2>' +
        langkah.map(function (l, i) {
          return '<div class="lp-step" data-step="' + i + '"><p class="lp-step-t">' + esc(l[0]) + '</p><p class="lp-step-s">' + esc(l[1]) + '</p>' +
            (i === 0 ? foto('img/warung.jpg', 'Warung bercat biru di Desa Ngawonggo, Malang, dengan pintu kayu terbuka', 1100, 619, 'lp-step-img') : '') + '</div>';
        }).join('') + '</div>' +
        '<div class="lp-alur-stage"><div class="lp-frag" id="lp-alur-frag" data-active="0">' + fragAlur() + '</div></div></section>' +

        '<section class="lp-show" aria-labelledby="lp-show-h"><div class="lp-show-index"><h2 id="lp-show-h">Yang dipegang anggota</h2><div class="lp-names" role="tablist" aria-label="Keluaran sistem">' +
        KELUAR.map(function (k, i) { return '<button type="button" role="tab" id="lp-tab-' + k[0] + '" aria-controls="lp-sheet" aria-selected="' + (i === 0) + '" data-act="lp-lembar" data-k="' + k[0] + '">' + k[1] + '</button>'; }).join('') +
        '</div><p class="body">Setiap lembar dibentuk dari buku besar yang sama, jadi angka di beranda anggota, di paket RAT, dan di dasbor dinas tidak bisa berbeda.</p></div>' +
        '<div class="lp-show-stage"><article class="lp-sheet" data-ui id="lp-sheet" role="tabpanel" aria-labelledby="lp-tab-ringkasan">' + lembar('ringkasan') + '</article></div></section>' +

        '<section class="lp-hitung" aria-labelledby="lp-hitung-h"><div class="lp-hitung-top"><h2 id="lp-hitung-h">Berapa Kopdes di kabupaten Anda?</h2>' +
        '<div class="lp-slider" data-ui><label for="lp-n">Koperasi Desa Merah Putih</label><div class="row between"><input id="lp-n" type="range" min="4" max="120" step="1" value="30" data-lp-n><output for="lp-n" id="lp-n-out" class="num">30</output></div></div></div>' +
        '<div class="lp-hitung-bottom"><p class="lp-figure num" aria-live="polite"><span id="lp-fig">15</span><span class="unit">pemuda</span></p>' +
        '<p class="lp-formula">Setiap pekerja KJDP menjadi pendamping utama bagi dua koperasi dan cadangan bagi dua koperasi lain. Jumlah pemuda yang bekerja adalah jumlah Kopdes dibagi dua, dibulatkan ke atas.</p></div></section>' +

        '<section class="lp-pilot" aria-labelledby="lp-pilot-h"><div class="lp-pilot-text"><h2 id="lp-pilot-h">Pilot 12 bulan, 30 Kopdes, lima ukuran</h2>' +
        '<ol class="lp-fase"><li><b>Bulan 1 sampai 3.</b> KJDP didirikan, anggotanya dilatih, perjanjian ditandatangani dengan dinas koperasi dan Kopdes peserta.</li><li><b>Bulan 4 sampai 9.</b> Buku besar dipasang, skor bulanan terbit, RAT pertama digelar dengan paket dibagikan lebih dahulu.</li><li><b>Bulan 10 sampai 12.</b> Hasil dievaluasi bersama dinas untuk replikasi ke kabupaten lain.</li></ol>' +
        '<dl class="lp-kpi"><div><dt>K1</dt><dd>27 dari 30 Kopdes menerbitkan laporan bulanan paling lambat tanggal 10, minimal 10 dari 12 bulan.</dd></div><div><dt>K2</dt><dd>60% anggota membuka ringkasan saldonya sekali per kuartal.</dd></div><div><dt>K3</dt><dd>90% Kopdes menggelar RAT dengan laporan dibagikan tujuh hari sebelumnya.</dd></div><div><dt>K4</dt><dd>Seluruh status Perlu tindakan ditindaklanjuti dalam 14 hari.</dd></div><div><dt>K5</dt><dd>15 pemuda bekerja di KJDP dengan upah sesuai UMK kabupaten.</dd></div></dl></div>' +
        '<figure class="lp-pilot-fig">' + foto('img/balai.jpg', 'Balai Desa Pandansari di Kabupaten Malang, bangunan putih berpilar biru di atas tembok batu', 960, 720) +
        '<figcaption>Balai desa, tempat RAT tatap muka digelar. e-RAT melengkapinya, tidak menggantikannya.</figcaption></figure></section>' +

        '<section class="lp-surat" aria-labelledby="lp-surat-h"><figure class="lp-surat-fig">' + foto('img/sawah.jpg', 'Petani menanam padi di sawah berair di Desa Gebangsari, Banyumas', 960, 720) + '</figure>' +
        '<div class="lp-letter"><h2 id="lp-surat-h">Mengapa koperasi pemuda</h2><span class="avatar" aria-hidden="true">MY</span>' +
        '<p>Program magang dan KKN mendekatkan mahasiswa dengan koperasi, tetapi penempatannya sementara, sedangkan pembukuan menuntut kesinambungan setiap bulan. Perangkat lunak saja juga tidak menjamin kebiasaan memakainya.</p>' +
        '<p>Karena itu saya mengusulkan Koperasi Jasa Digital Pemuda di tingkat kabupaten. Pemudanya menjadi anggota sekaligus pekerja, memperoleh pendapatan dari tarif layanan yang disepakati dalam RAT, dan berkepentingan agar koperasi yang didampinginya tetap sehat.</p>' +
        '<p>KJDP menghitung skor koperasi yang juga membayar jasanya. Supaya penilaiannya tetap jujur, rumus skor dibuka untuk pengawas dan dinas, dan dinas bisa menghitung ulang dari data yang sama untuk memastikan hasilnya cocok.</p>' +
        '<p class="lp-sign">Muhammad Yusuf Arrayyan</p><p class="small body">Penggagas, Universitas Bengkulu · esai COOPFEST 2026</p></div></section>' +

        '<section class="lp-proof" aria-labelledby="lp-proof-h"><div class="lp-tiles"><div class="lp-tile lead"><h2 id="lp-proof-h">Pijakan rancangan</h2></div>' +
        [['PEARLS', 'Evans dan Branch, 2002'], ['UU 27/2022', 'Pelindungan Data Pribadi'], ['SDGs 16.6', 'Kelembagaan akuntabel'], ['SDGs 16.7', 'Keputusan partisipatif'], ['SDGs 8.6', 'Pemuda bekerja'], ['SDGs 17.17', 'Kemitraan']].map(function (t) {
          return '<div class="lp-tile"><b>' + t[0] + '</b><span>' + t[1] + '</span></div>';
        }).join('') + '</div></section>' +

        '<section class="lp-cta" aria-labelledby="lp-cta-h"><div class="lp-cta-text"><h2 id="lp-cta-h">Buka bukunya</h2><p>Pilih peran, lalu jalankan skenario demo dari tombol Panel demo. Semua data simulasi; tidak ada data koperasi nyata.</p></div>' +
        '<form class="lp-dialog" data-ui data-form="lp-masuk"><h3>Masuk ke prototipe</h3><p class="small body">Di prototipe ini tidak ada kata sandi. Pilih peran, lalu masuk.</p>' +
        '<div class="field"><span class="flabel" id="lp-peran-l">Peran</span><div class="seg lp-seg" role="radiogroup" aria-labelledby="lp-peran-l">' +
        ['ANG', 'PNG', 'PGW', 'KJD', 'DIN'].map(function (k, i) { return '<label><input type="radio" name="peran" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span>' + App.PERAN[k].nama.replace('Pendamping KJDP', 'Pendamping').replace('Dinas Koperasi', 'Dinas') + '</span></label>'; }).join('') + '</div></div>' +
        '<div class="field" id="lp-ang"><label for="lp-anggota">Anggota</label><select class="input" id="lp-anggota" name="anggota">' +
        d.s.anggota.map(function (a) { return '<option value="' + a.id + '"' + (a.id === 'A04' ? ' selected' : '') + '>' + esc(a.nama) + ' · ' + a.no + '</option>'; }).join('') + '</select></div>' +
        '<button class="btn primary block" type="submit" id="lp-go">Buka sebagai Anggota</button></form></section>' +

        '<p class="lp-credit">Foto: “Tugu Koperasi Indonesia (1)” oleh Mirani Pramitasari; “Warung Biru - Desa Ngawonggo” oleh Hngdery; “Village Meeting Hall of Pandansari” oleh ShinyFiver (CC BY-SA 4.0); “Bms rice planting 141229-47913 rwg” oleh Wie146 (CC BY-SA 3.0); semuanya via Wikimedia Commons.</p>' +
        '</main>' +
        '<footer class="lp-foot"><span>TERANG-KOP · prototipe esai COOPFEST 2026</span><nav aria-label="Tautan kaki"><a href="#/masuk">Masuk</a><a href="https://github.com/YusufArrayyan/TERANG-KOP">Kode sumber</a></nav><span>2026 · data simulasi, tanpa data pribadi nyata</span></footer>' +
        '</div>';
    },
    after: function () {
      var root = document.querySelector('.lp');
      if (!root) return;
      var set = [];
      root.addEventListener('change', function (e) {
        var t = e.target;
        if (t.hasAttribute('data-lp-tagih')) {
          set = Array.prototype.filter.call(root.querySelectorAll('[data-lp-tagih]'), function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-lp-tagih'); });
          var f = document.getElementById('lp-skor'), fokus = t.getAttribute('data-lp-tagih');
          f.innerHTML = fragSkor(set);
          var n = f.querySelector('[data-lp-tagih="' + fokus + '"]'); if (n) n.focus();
        }
        if (t.name === 'peran') {
          var ang = t.value === 'ANG';
          document.getElementById('lp-ang').hidden = !ang;
          document.getElementById('lp-go').textContent = 'Buka sebagai ' + App.PERAN[t.value].nama;
        }
      });
      var n = document.getElementById('lp-n');
      if (n) n.addEventListener('input', function () {
        document.getElementById('lp-n-out').textContent = n.value;
        document.getElementById('lp-fig').textContent = Math.ceil(+n.value / 2);
      });
      if (App._lpObs) App._lpObs.forEach(function (o) { o.disconnect(); });
      App._lpObs = [];
      if (!('IntersectionObserver' in window)) return;
      // Langkah aktif mengganti keadaan potongan yang menempel.
      var frag = document.getElementById('lp-alur-frag');
      var steps = root.querySelectorAll('.lp-step');
      var oStep = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = e.target.getAttribute('data-step');
          frag.setAttribute('data-active', i);
          steps.forEach(function (s) { s.classList.toggle('on', s === e.target); });
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { oStep.observe(s); });
      App._lpObs.push(oStep);
      // Masuk bertahap: hanya bagian yang belum terlihat yang disembunyikan dulu, jadi isi tidak pernah hilang.
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var parts = root.querySelectorAll('.lp-main h2, .lp-main section p, .lp-main figure, .lp-main [data-ui], .lp-tile, .lp-fase li, .lp-kpi > div, .lp-names button');
      var vh = window.innerHeight;
      var oIn = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target, sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
          el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
          el.classList.add('lp-in'); oIn.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      parts.forEach(function (el) {
        if (el.getBoundingClientRect().top > vh) { el.classList.add('lp-pre'); oIn.observe(el); }
      });
      App._lpObs.push(oIn);
    }
  };

  App.acts['lp-ke'] = function (el) {
    var t = document.getElementById(el.getAttribute('data-to'));
    if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  App.acts['lp-lembar'] = function (el) {
    var k = el.getAttribute('data-k'), sh = document.getElementById('lp-sheet');
    el.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', b === el ? 'true' : 'false'); });
    sh.setAttribute('aria-labelledby', 'lp-tab-' + k);
    sh.classList.add('swap');
    setTimeout(function () { sh.innerHTML = lembar(k); sh.classList.remove('swap'); }, 160);
  };
  App.forms['lp-masuk'] = function (f) {
    var d = App.formData(f);
    App.session = { peran: d.peran, anggota_id: d.peran === 'ANG' ? d.anggota : null };
    App.saveSession();
    var P = App.PERAN[d.peran];
    location.hash = '#/' + P.kode + '/' + P.nav[0][0];
  };
})();
