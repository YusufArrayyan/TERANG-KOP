/* TERANG-KOP — inti antarmuka: penyimpanan, sesi, router, kerangka, komponen. */
(function () {
  'use strict';
  var TK = window.TK, SEED = window.SEED;
  var App = window.App = { views: {}, acts: {}, forms: {}, inputs: {}, state: null, session: null, prefs: {}, ui: {} };
  var KEY = 'terangkop.state.v4', KEY_SES = 'terangkop.sesi.v1', KEY_PREF = 'terangkop.pref.v1';

  /* ---------- Penyimpanan (localStorage dalam try/catch) ---------- */
  function baca(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function tulis(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  App.load = function () {
    var s = baca(KEY);
    if (!s || s.versi !== 4 || !Array.isArray(s.entri)) { s = SEED.stateAwal(); delete s._galatSeed; s.online = true; }
    App.state = s;
    TK.periksaPengingat(s);
    App.session = baca(KEY_SES);
    App.prefs = baca(KEY_PREF) || { tema: 'sistem' };
    App._wil = null;
  };
  App.save = function () {
    if (!tulis(KEY, App.state)) App.toast('Data tidak tersimpan di perangkat ini. Perubahan hilang saat halaman dimuat ulang.', 'bad');
  };
  App.saveSession = function () { tulis(KEY_SES, App.session); };
  App.savePrefs = function () { tulis(KEY_PREF, App.prefs); };
  App.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
    App.state = SEED.stateAwal(); delete App.state._galatSeed; App.state.online = true; App._wil = null;
    App.save();
  };

  /* ---------- Utilitas ---------- */
  var esc = App.esc = function (s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  App.rp = TK.rp; App.tgl = TK.fmtTgl;
  App.today = function () { return App.state.tanggalSimulasi; };
  App.anggota = function (id) { return App.state.anggota.filter(function (a) { return a.id === id; })[0]; };
  App.namaAnggota = function (id) { var a = App.anggota(id); return a ? a.nama : '—'; };
  App.inisial = function (n) { return n.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); };
  App.namaDepan = function (n) { return n.split(' ')[0]; };
  App.persen = function (x) { return (Math.round(x * 1000) / 10).toString().replace('.', ',') + '%'; };
  App.tglPanjang = function (s) { return +s.slice(8, 10) + ' ' + TK.BULAN[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4); };
  App.uid = function () { return 'cid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); };
  App.pendek = function (h, n) { n = n || 10; return h ? h.slice(0, n) + '…' + h.slice(-6) : '—'; };

  /* ---------- Ikon (garis, 24×24) ---------- */
  var IC = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    vote: '<path d="M4 15h16v5H4z"/><path d="M8 15V5h8v10"/><path d="m10 9.5 1.5 1.5 3-3"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5v-15Z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8M8 11h6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    fileCheck: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8l-5-5Z"/><path d="M14 3v5h5"/><path d="m9 14 2 2 4-4"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    map: '<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Z"/><path d="M9 4v13.5M15 6.5V20"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    alert: '<path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4.5M12 17.5v.5"/>',
    octagon: '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5Z"/><path d="M12 8v5M12 16.5v.5"/>',
    gauge: '<path d="M4.5 18a8.5 8.5 0 1 1 15 0"/><path d="m12 13 3.5-4"/><circle cx="12" cy="13" r="1.2"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.5a9.5 9.5 0 0 1 13 0"/><path d="M8.6 16a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19.5" r="1"/>',
    wifiOff: '<path d="m3 3 18 18"/><path d="M8.6 16a5 5 0 0 1 6.8 0"/><path d="M5.5 12.5a9.5 9.5 0 0 1 4.1-2.3M14.6 10.3a9.5 9.5 0 0 1 3.9 2.2"/><path d="M2.5 9a14 14 0 0 1 4-2.6M11 5.1a14 14 0 0 1 10.5 3.9"/><circle cx="12" cy="19.5" r="1"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20.5V16h-4.5"/>',
    play: '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    logout: '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
    chevR: '<path d="m9 5 7 7-7 7"/>',
    chevL: '<path d="m15 5-7 7 7 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    hash: '<path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 19h16"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M16 14h.5"/>',
    coins: '<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7"/><path d="M9.5 16.5c.6 1.2 2.9 2 5.5 2 3 0 5.5-1.1 5.5-2.5v-4c0-1.3-2.1-2.3-4.8-2.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    send: '<path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4 18-7Z"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h.5M12 11h.5M15.5 11h.5M8.5 14.5h.5M12 14.5h.5M15.5 14.5V18M8.5 18h.5M12 18h.5"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'
  };
  var icon = App.icon = function (n, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; };
  App.LOGO = '<svg viewBox="260 200 740 870" aria-hidden="true"><g fill="#1a7060"><path d="M300 452 L625 258 L950 452" fill="none" stroke="#1a7060" stroke-width="80" stroke-linecap="round" stroke-linejoin="round"/><circle cx="625" cy="465" r="68"/><circle cx="463" cy="526" r="54"/><circle cx="790" cy="526" r="54"/><path d="M500 760 V682 C500 604 557 548 625 548 C693 548 752 604 752 682 V726 L590 815 C565 790 535 773 500 760 Z"/><path d="M376 716 V672 C376 626 413 592 463 592 C478 592 491 595 502 600 C488 628 482 657 482 692 V751 C450 736 412 724 376 716 Z"/><path d="M752 600 C764 594 777 592 790 592 C822 592 846 606 862 630 C832 668 802 694 770 714 V682 C770 652 764 626 752 600 Z"/><path d="M305 768 Q305 752 322 753 C470 763 600 820 645 905 C655 930 658 952 658 972 C682 925 762 886 938 870 Q950 869 950 882 V914 Q950 932 931 936 C802 960 722 992 660 1036 Q640 1050 621 1034 C541 960 452 896 322 886 Q305 885 305 868 Z"/></g><g fill="#f5ad1e"><path d="M662 846 L728 812 Q741 806 741 820 V882 C712 893 686 906 662 923 Z"/><path d="M772 788 L832 760 Q846 754 846 768 V857 C820 860 796 864 772 870 Z"/><path d="M874 720 L934 684 Q948 676 948 692 V852 C924 850 899 851 874 852 Z"/><path d="M606 832 C705 776 832 738 925 600" fill="none" stroke="#f5ad1e" stroke-width="24" stroke-linecap="round"/><path d="M893 576 L972 535 Q988 528 988 545 L986 618 Q985 634 970 626 Z"/></g></svg>';

  /* ---------- Komponen ---------- */
  var STATUS = {
    'Sehat': { cls: 'sehat', ic: 'checkCircle', pesan: 'Kondisi koperasi baik bulan ini.' },
    'Waspada': { cls: 'waspada', ic: 'alert', pesan: 'Ada bagian yang perlu dibenahi sebelum membesar.' },
    'Perlu tindakan': { cls: 'tindakan', ic: 'octagon', pesan: 'Pengurus wajib menindaklanjuti dan menjelaskan langkahnya kepada anggota dalam 14 hari.' },
    'Dikalibrasi': { cls: 'kalibrasi', ic: 'gauge', pesan: 'Masa kalibrasi tiga bulan pertama. Skor dihitung, tetapi status belum dijatuhkan.' }
  };
  App.STATUS = STATUS;
  App.statusBadge = function (st, lg) {
    var m = STATUS[st] || { cls: 'netral', ic: 'info' };
    return '<span class="status ' + m.cls + (lg ? ' lg' : '') + '">' + icon(m.ic, 'sm') + esc(st) + '</span>';
  };
  App.chip = function (txt, cls, ic) { return '<span class="chip ' + (cls || '') + '">' + (ic ? icon(ic, 'sm') : '') + esc(txt) + '</span>'; };
  var WARNA = { hijau: { ic: 'checkCircle', lbl: 'Hijau' }, kuning: { ic: 'alert', lbl: 'Kuning' }, merah: { ic: 'octagon', lbl: 'Merah' } };
  App.indBadge = function (w) { return '<span class="ind ' + w + '">' + icon(WARNA[w].ic, 'sm') + WARNA[w].lbl + '</span>'; };
  App.gauge = function (nilai, status, sm) {
    var r = 52, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, nilai)) / 100);
    var col = { 'Sehat': 'var(--ok-mark)', 'Waspada': 'var(--warn-mark)', 'Perlu tindakan': 'var(--bad-mark)', 'Dikalibrasi': 'var(--cal-mark)' }[status] || 'var(--brand)';
    return '<div class="gauge' + (sm ? ' sm' : '') + '" role="img" aria-label="Skor ' + nilai + ' dari 100, ' + esc(status) + '">' +
      '<svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="' + r + '" fill="none" stroke-width="12"/>' +
      '<circle class="val" cx="60" cy="60" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
      '<div class="lbl"><b>' + nilai + '</b><span>dari 100</span></div></div>';
  };
  App.spark = function (vals) {
    if (!vals.length) return '';
    var w = 88, h = 28;
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = Math.max(8, (hi - lo) * 0.15); lo -= pad; hi += pad;
    var xy = vals.map(function (v, i) { return [vals.length === 1 ? w / 2 : i * (w - 8) / (vals.length - 1) + 4, h - 4 - (v - lo) / (hi - lo) * (h - 8)]; });
    var last = xy[xy.length - 1];
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Tren skor: ' + vals.join(', ') + '"><polyline points="' +
      xy.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="2.6"/></svg>';
  };
  App.empty = function (ic, judul, teks, tombol) {
    return '<div class="empty"><div class="ic">' + icon(ic, 'lg') + '</div><h3>' + esc(judul) + '</h3><p>' + teks + '</p>' + (tombol || '') + '</div>';
  };
  App.callout = function (kind, ic, html) { return '<div class="callout ' + kind + '">' + icon(ic) + '<div class="grow">' + html + '</div></div>'; };
  App.pageHead = function (judul, sub, aksi, crumb) {
    return '<div class="page-head"><div>' + (crumb ? '<a class="crumb" href="' + crumb[0] + '">' + icon('chevL', 'sm') + esc(crumb[1]) + '</a>' : '') +
      '<h1 tabindex="-1" id="judul">' + esc(judul) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (aksi ? '<div class="row">' + aksi + '</div>' : '') + '</div>';
  };

  /* ---------- Peran dan navigasi ---------- */
  App.PERAN = {
    ANG: { kode: 'ang', nama: 'Anggota', ic: 'wallet', desk: 'Lihat simpanan, pinjaman, estimasi SHU, kondisi koperasi, dan ikut RAT.',
      nav: [['beranda', 'Beranda', 'home'], ['riwayat', 'Riwayat', 'list'], ['koperasi', 'Koperasi', 'shield'], ['rat', 'RAT', 'vote'], ['cetak', 'Ringkasan cetak', 'print']] },
    PNG: { kode: 'png', nama: 'Pengurus', ic: 'book', desk: 'Catat transaksi, kelola pinjaman, tutup buku, terbitkan paket RAT, tanggapi peringatan.',
      nav: [['beranda', 'Beranda', 'home'], ['catat', 'Catat transaksi', 'plus'], ['buku', 'Buku besar', 'book'], ['anggota', 'Anggota dan pinjaman', 'users'], ['tutup', 'Tutup buku', 'lock'], ['rat', 'RAT', 'vote'], ['tiket', 'Tindak lanjut', 'flag']] },
    PGW: { kode: 'pgw', nama: 'Pengawas', ic: 'fileCheck', desk: 'Baca seluruh data, sahkan laporan sebelum terbit, verifikasi tindak lanjut.',
      nav: [['tinjau', 'Tinjau laporan', 'fileCheck'], ['rat', 'RAT', 'vote'], ['verifikasi', 'Verifikasi tindak lanjut', 'checkCircle'], ['buku', 'Buku besar', 'book']] },
    KJD: { kode: 'kjd', nama: 'Pendamping KJDP', ic: 'users', desk: 'Pantau koperasi asuhan, tangani tiket pendampingan, tulis catatan.',
      nav: [['asuhan', 'Koperasi asuhan', 'map'], ['tiket', 'Tiket', 'ticket']] },
    DIN: { kode: 'din', nama: 'Dinas Koperasi', ic: 'map', desk: 'Pantau 30 koperasi, hitung ulang skor, lihat ambang dan papan KPI, ekspor.',
      nav: [['wilayah', 'Wilayah', 'map'], ['kpi', 'Papan KPI', 'chart'], ['ambang', 'Ambang', 'sliders'], ['ekspor', 'Ekspor', 'download']] }
  };
  App.ORANG = {
    PNG: { nama: 'Rina Wulandari', jabatan: 'Bendahara' },
    PGW: { nama: 'Hendra Gunawan', jabatan: 'Pengawas' },
    KJD: { nama: 'Dimas Pratama', jabatan: 'Pendamping KJDP' },
    DIN: { nama: 'Ratih Kusumawardani', jabatan: 'Dinas Koperasi Kab. Tanah Terang' }
  };
  App.pengguna = function () {
    var s = App.session; if (!s) return null;
    if (s.peran === 'ANG') { var a = App.anggota(s.anggota_id) || App.state.anggota[3]; return { nama: a.nama, jabatan: 'Anggota · ' + a.no }; }
    return App.ORANG[s.peran];
  };
  App.kodePeran = function () { return App.PERAN[App.session.peran].kode; };
  App.href = function (layar, arg) { return '#/' + App.kodePeran() + '/' + layar + (arg ? '/' + arg : ''); };
  App.go = function (layar, arg) { var h = App.href(layar, arg); if (location.hash === h) App.render(); else location.hash = h; };

  App.audit = function (aksi, anggotaId) {
    var s = App.session; if (!s || s.peran === 'ANG') return;
    var o = App.ORANG[s.peran];
    var last = App.state.audit[App.state.audit.length - 1];
    if (last && last.aksi === aksi && last.peran === s.peran && last.tanggal === App.today()) return;
    App.state.audit.push({ tanggal: App.today(), peran: s.peran, nama: o.nama + ' (' + App.PERAN[s.peran].nama + ')', aksi: aksi, anggota_id: anggotaId });
    App.save();
  };

  /* ---------- Turunan data ---------- */
  App.skorDetail = function (pid) {
    var rec = App.state.skor.filter(function (s) { return s.periode_id === pid; })[0];
    if (!rec) return null;
    var amb = App.state.ambang.filter(function (a) { return a.versi === rec.ambang_versi; })[0] || TK.ambangAktif(App.state);
    var r = TK.ringkasanPeriode(App.state, pid, rec.asOf);
    var sk = TK.hitungSkor(r, amb);
    sk.rekam = rec; sk.ringkasan = r; sk.periode = pid;
    return sk;
  };
  App.periodeTerbitTerakhir = function () {
    var t = App.state.periode.filter(function (p) { return p.status === 'Terbit'; });
    return t.length ? t[t.length - 1] : null;
  };
  App.tiketKop = function (kopId) { return App.state.tiket.filter(function (t) { return t.koperasi_id === kopId; }); };
  App.tiketTerbuka = function (kopId) { return App.tiketKop(kopId).filter(function (t) { return t.status !== 'Selesai'; }); };
  App.terlambat = function (t) { return TK.terlambat(t, App.today()); };
  App.antreanAktif = function () { return App.state.antrean || []; };

  /* Koperasi wilayah: 29 simulasi + Sukamaju (dari buku besar sungguhan). */
  App.wilayah = function () {
    if (!App._wil) App._wil = SEED.bangunWilayah().koperasi;
    var s = App.state, kop = s.koperasi;
    var bulan = SEED.PERIODE_WIL.map(function (pid) {
      var p = TK.cariPeriode(s, pid); var rec = s.skor.filter(function (x) { return x.periode_id === pid; })[0];
      if (!p || !rec) return null;
      return { periode: pid, nilai: rec.nilai, status: rec.status, terbit_pada: p.terbit_pada || null, ambang_versi: rec.ambang_versi };
    }).filter(Boolean);
    // Periode setelah September yang sudah ditutup ikut tampil sebagai status terbaru.
    s.skor.forEach(function (rec) {
      if (rec.periode_id > '2026-09') {
        var p = TK.cariPeriode(s, rec.periode_id);
        bulan.push({ periode: rec.periode_id, nilai: rec.nilai, status: rec.status, terbit_pada: p.terbit_pada || null, ambang_versi: rec.ambang_versi });
      }
    });
    var suk = {
      id: kop.id, nama: kop.nama, desa: kop.desa, kecamatan: kop.kecamatan, anggota: s.anggota.length,
      pendamping_utama: kop.pendamping_utama, pendamping_cadangan: kop.pendamping_cadangan, bulan: bulan,
      bukaKuartal: (function () { var b = {}; var batas = TK.tgl.addDays(App.today(), -90); s.logRingkasan.forEach(function (l) { if (l.tanggal > batas) b[l.anggota_id] = 1; }); return Object.keys(b).length; })(),
      rat: { tanggal: s.rat.tanggal, status: s.rat.status, paket_h: s.rat.paket ? s.rat.paket.h_minus : null }, sintetis: false
    };
    return [suk].concat(App._wil);
  };
  App.kopById = function (id) { return App.wilayah().filter(function (k) { return k.id === id; })[0]; };
  App.tepatWaktu = function (b) { return b.terbit_pada && b.terbit_pada <= TK.tgl.awalPeriode(TK.tgl.periodeBerikut(b.periode)).slice(0, 8) + '10'; };

  /* ---------- Tema ---------- */
  App.applyTheme = function () {
    var t = App.prefs.tema || 'sistem';
    var dark = t === 'gelap' || (t === 'sistem' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#0f1715' : '#ffffff');
  };

  /* ---------- Toast, dialog, lembar ---------- */
  App.toast = function (msg, kind) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = icon(kind === 'bad' ? 'alert' : 'checkCircle') + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity 240ms'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 260); }, 4200);
  };
  App.confirm = function (o) {
    return new Promise(function (resolve) {
      var d = document.getElementById('dlg');
      d.className = 'modal';
      d.innerHTML = '<div class="modal-card" role="document"><h2 id="dlg-t">' + esc(o.judul) + '</h2><div class="stack sm body" id="dlg-b">' + o.isi + '</div>' +
        '<div class="actions"><button class="btn outline" value="batal" data-dlg="0">Batal</button>' +
        '<button class="btn ' + (o.bahaya ? 'danger' : 'primary') + '" data-dlg="1">' + esc(o.tombol) + '</button></div></div>';
      d.setAttribute('aria-labelledby', 'dlg-t'); d.setAttribute('aria-describedby', 'dlg-b');
      var selesai = function (v) { d.close(); d.innerHTML = ''; resolve(v); };
      d.querySelectorAll('[data-dlg]').forEach(function (b) { b.onclick = function () { selesai(b.getAttribute('data-dlg') === '1'); }; });
      d.oncancel = function (e) { e.preventDefault(); selesai(false); };
      d.onclick = function (e) { if (e.target === d) selesai(false); };
      d.showModal();
      var btn = d.querySelector('[data-dlg="0"]'); if (btn) btn.focus();
    });
  };
  App.modal = function (judul, isi, aksi) {
    var d = document.getElementById('dlg');
    d.className = 'modal';
    d.innerHTML = '<div class="modal-card"><div class="row between top"><h2 id="dlg-t">' + esc(judul) + '</h2><button class="icon-btn" data-close aria-label="Tutup">' + icon('x') + '</button></div><div class="stack">' + isi + '</div>' +
      (aksi ? '<div class="actions">' + aksi + '</div>' : '') + '</div>';
    d.setAttribute('aria-labelledby', 'dlg-t');
    d.onclick = function (e) { if (e.target === d || e.target.closest('[data-close]')) { d.close(); } };
    d.oncancel = null;
    d.showModal();
  };
  App.sheet = function (judul, isi) {
    var d = document.getElementById('sheet');
    d.innerHTML = '<div class="sheet-card"><div class="row between"><h2 id="sheet-t">' + esc(judul) + '</h2><button class="icon-btn" data-close aria-label="Tutup">' + icon('x') + '</button></div>' + isi + '</div>';
    d.setAttribute('aria-labelledby', 'sheet-t');
    d.onclick = function (e) { if (e.target === d || e.target.closest('[data-close]')) d.close(); };
    if (!d.open) d.showModal();
  };
  App.closeSheet = function () { var d = document.getElementById('sheet'); if (d.open) d.close(); };

  App.salin = function (teks, label) {
    var ok = function () { App.toast(label + ' disalin ke papan klip.'); };
    var gagal = function () {
      App.modal('Salin ' + label, '<p class="body">Papan klip tidak dapat diakses dari halaman ini. Pilih semua teks di bawah, lalu salin.</p><textarea class="input mono" rows="10" readonly>' + esc(teks) + '</textarea>');
    };
    try {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(teks).then(ok, gagal);
      else gagal();
    } catch (e) { gagal(); }
  };
  App.unduh = function (nama, isi, tipe) {
    try {
      var blob = new Blob([isi], { type: tipe || 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    } catch (e) { App.toast('Berkas tidak dapat dibuat di peramban ini.', 'bad'); }
  };

  /* ---------- Router dan kerangka ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var q = {}, qi = h.indexOf('?');
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    var parts = h.split('/').filter(Boolean);
    return { peran: parts[0], layar: parts[1], arg: parts[2], q: q };
  }
  App.route = parseHash;

  App.render = function () {
    App.applyTheme();
    var root = document.getElementById('app');
    var r = parseHash();
    if (r.peran === 'depan' || (!App.session && r.peran !== 'masuk')) {
      document.documentElement.setAttribute('data-theme', 'light'); // halaman depan selalu terang
      var tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', '#0d2a22');
      root.innerHTML = App.views.depan.render(r);
      document.title = 'TERANG-KOP · pembukuan Koperasi Desa Merah Putih yang terbuka bagi anggota';
      App.views.depan.after(r);
      if (App._lastRoute !== location.hash) window.scrollTo(0, 0);
      App._lastRoute = location.hash;
      return;
    }
    if (!App.session) {
      root.innerHTML = App.views.masuk.render(r);
      if (App.views.masuk.after) App.views.masuk.after();
      document.title = 'Masuk · TERANG-KOP';
      App._lastRoute = location.hash;
      return;
    }
    var P = App.PERAN[App.session.peran];
    if (r.peran !== P.kode || !r.layar) { location.replace('#/' + P.kode + '/' + P.nav[0][0]); return; }
    var key = P.kode + '/' + r.layar;
    var view = App.views[key] || App.views[r.layar];
    if (!view) { location.replace('#/' + P.kode + '/' + P.nav[0][0]); return; }
    var html;
    try { html = view.render(r); }
    catch (e) {
      console.error(e);
      html = App.pageHead('Halaman tidak dapat ditampilkan') + App.callout('bad', 'alert', '<p>Terjadi kesalahan saat menyusun halaman ini. Muat ulang halaman. Bila masih terjadi, atur ulang data simulasi dari Panel demo.</p>');
    }
    var aktif = view.nav || r.layar;
    root.innerHTML = shell(P, aktif, html);
    document.title = (view.title ? (typeof view.title === 'function' ? view.title(r) : view.title) + ' · ' : '') + 'TERANG-KOP';
    if (view.after) view.after(r);
    if (App._focusNext !== false) {
      var h1 = document.getElementById('judul');
      if (h1 && App._lastRoute !== location.hash) h1.focus({ preventScroll: true });
    }
    if (App._lastRoute !== location.hash) window.scrollTo(0, 0);
    App._lastRoute = location.hash;
  };

  function shell(P, aktif, html) {
    var u = App.pengguna();
    var s = App.state;
    var q = App.antreanAktif().length;
    var badge = function (layar) {
      var n = 0;
      if (P.kode === 'png' && layar === 'tiket') n = App.tiketTerbuka(s.koperasi.id).filter(function (t) { return (t.jenis === 'Tindak lanjut' && t.status !== 'Menunggu verifikasi') || t.jenis === 'Pengingat'; }).length;
      if (P.kode === 'pgw' && layar === 'verifikasi') n = App.state.tiket.filter(function (t) { return t.koperasi_id === s.koperasi.id && t.status === 'Menunggu verifikasi'; }).length;
      if (P.kode === 'pgw' && layar === 'tinjau') n = s.periode.filter(function (p) { return p.status === 'Ditutup'; }).length;
      if (P.kode === 'png' && layar === 'catat') n = q;
      return n ? '<span class="badge-dot" aria-label="' + n + ' perlu perhatian">' + n + '</span>' : '';
    };
    var navLinks = P.nav.map(function (n) {
      return '<a href="#/' + P.kode + '/' + n[0] + '"' + (aktif === n[0] ? ' aria-current="page"' : '') + '>' + icon(n[2]) + '<span>' + esc(n[1]) + '</span>' + badge(n[0]) + '</a>';
    }).join('');
    var shared = [['cara-skor', 'Cara skor dihitung', 'calc'], ['tentang', 'Tentang prototipe', 'info']].map(function (n) {
      return '<a href="#/' + P.kode + '/' + n[0] + '"' + (aktif === n[0] ? ' aria-current="page"' : '') + '>' + icon(n[2]) + '<span>' + n[1] + '</span></a>';
    }).join('');
    var maxTab = P.nav.length > 5 ? 4 : P.nav.length;
    var tabs = P.nav.slice(0, maxTab).map(function (n) {
      var lbl = n[1].replace('Anggota dan pinjaman', 'Anggota').replace('Catat transaksi', 'Catat').replace('Ringkasan cetak', 'Cetak').replace('Verifikasi tindak lanjut', 'Verifikasi').replace('Tinjau laporan', 'Tinjau').replace('Koperasi asuhan', 'Asuhan');
      return '<a href="#/' + P.kode + '/' + n[0] + '"' + (aktif === n[0] ? ' aria-current="page"' : '') + '><span class="pill">' + icon(n[2]) + '</span>' + esc(lbl) + '</a>';
    }).join('') + '<button type="button" data-act="lainnya" aria-label="Menu lainnya"><span class="pill">' + icon('more') + '</span>Lainnya</button>';
    return '<button type="button" class="skip" data-act="lewati">Lewati ke konten</button>' +
      '<header class="topbar">' +
      '<a class="brand" href="#/' + P.kode + '/' + P.nav[0][0] + '" aria-label="TERANG-KOP, ke beranda">' + App.LOGO + '<div><b translate="no">TERANG-KOP</b><span>' + esc(P.kode === 'din' ? s.koperasi.kabupaten : P.kode === 'kjd' ? 'KJDP ' + s.koperasi.kabupaten.replace('Kabupaten ', 'Kab. ') : s.koperasi.nama) + '</span></div></a>' +
      '<div class="spacer"></div>' +
      '<button class="conn" data-act="koneksi" data-online="' + (s.online ? 'true' : 'false') + '" aria-label="Status koneksi simulasi: ' + (s.online ? 'Daring' : 'Luring') + '. Tekan untuk mengganti.">' +
      icon(s.online ? 'wifi' : 'wifiOff') + '<span class="txt">' + (s.online ? 'Daring' : 'Luring') + '</span>' + (q ? '<span class="count">' + q + '</span>' : '') + '</button>' +
      '<button class="user" data-act="menu-user" aria-haspopup="dialog"><span class="avatar">' + App.inisial(u.nama) + '</span><span class="who"><b>' + esc(u.nama) + '</b><span>' + esc(P.nama === 'Anggota' ? 'Anggota' : u.jabatan) + '</span></span></button>' +
      '</header>' +
      '<div class="banner" role="note"><span><b>Prototipe.</b> Semua data di layar ini simulasi dan bukan data koperasi nyata.</span><span>Tanggal simulasi: <b>' + App.tgl(s.tanggalSimulasi) + '</b></span></div>' +
      '<div class="layout"><nav class="sidenav" aria-label="Navigasi utama">' + navLinks + '<div class="sep" role="presentation"></div>' + shared + '</nav>' +
      '<main id="konten"><div class="page">' + html + '</div></main></div>' +
      '<nav class="tabbar" aria-label="Navigasi utama">' + tabs + '</nav>' +
      '<button class="btn dark fab" data-act="demo" aria-label="Buka panel demo">' + icon('play') + '<span class="txt">Panel demo</span></button>';
  }

  /* ---------- Delegasi peristiwa ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var f = App.acts[el.getAttribute('data-act')];
    if (f) { e.preventDefault(); f(el, e); }
  });
  document.addEventListener('submit', function (e) {
    var f = App.forms[e.target.getAttribute('data-form')];
    if (f) { e.preventDefault(); f(e.target, e); }
  });
  document.addEventListener('input', function (e) {
    var form = e.target.closest('[data-input]');
    if (form && App.inputs[form.getAttribute('data-input')]) App.inputs[form.getAttribute('data-input')](form, e);
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-change]');
    if (el && App.acts[el.getAttribute('data-change')]) App.acts[el.getAttribute('data-change')](el, e);
  });
  window.addEventListener('hashchange', function () { App.closeSheet(); App.render(); });
  window.addEventListener('online', function () { if (App.session) App.render(); });

  App.formData = function (form) {
    var o = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
      o[el.name] = el.value;
    });
    return o;
  };
  App.angka = function (s) { if (s === undefined || s === null) return NaN; var t = String(s).replace(/[.\s]/g, '').replace(/^Rp/i, ''); if (t === '') return NaN; return /^-?\d+$/.test(t) ? parseInt(t, 10) : NaN; };

  /* ---------- Aksi umum ---------- */
  App.acts.koneksi = function () {
    var s = App.state;
    s.online = !s.online;
    App.save();
    if (s.online && App.antreanAktif().some(function (q) { return q.status === 'Menunggu sinkron'; })) {
      App.render();
      App.toast('Kembali daring. Antrean siap disinkronkan dari layar Catat transaksi.');
    } else {
      App.render();
      App.toast(s.online ? 'Kembali daring (simulasi).' : 'Luring (simulasi). Transaksi baru masuk antrean Menunggu sinkron.');
    }
  };
  App.acts['menu-user'] = function () {
    var u = App.pengguna(), P = App.PERAN[App.session.peran];
    var t = App.prefs.tema || 'sistem';
    App.sheet(u.nama, '<p class="body">' + esc(P.nama) + (App.session.peran === 'ANG' ? '' : ' · ' + esc(u.jabatan)) + '</p>' +
      '<div class="field"><span class="flabel" id="tema-l">Tema</span><div class="seg" role="group" aria-labelledby="tema-l">' +
      [['terang', 'Terang'], ['gelap', 'Gelap'], ['sistem', 'Ikut sistem']].map(function (x) { return '<button type="button" data-act="tema" data-v="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="stack sm"><a class="btn outline block" href="' + App.href('cara-skor') + '">' + icon('calc') + 'Cara skor dihitung</a>' +
      '<a class="btn outline block" href="' + App.href('tentang') + '">' + icon('info') + 'Tentang prototipe</a>' +
      '<button class="btn secondary block" data-act="keluar">' + icon('logout') + 'Keluar dan ganti peran</button></div>');
  };
  App.acts.tema = function (el) {
    App.prefs.tema = el.getAttribute('data-v'); App.savePrefs(); App.applyTheme();
    el.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === el ? 'true' : 'false'); });
  };
  App.acts.lewati = function () { var m = document.getElementById('judul') || document.getElementById('konten'); if (m) { m.focus(); m.scrollIntoView({ block: 'start' }); } };
  App.acts.keluar = function () { App.closeSheet(); App.session = null; App.saveSession(); location.hash = '#/masuk'; App.render(); };
  App.acts.lainnya = function () {
    var P = App.PERAN[App.session.peran];
    var maxTab = P.nav.length > 5 ? 4 : P.nav.length;
    var sisa = P.nav.slice(maxTab).concat([['cara-skor', 'Cara skor dihitung', 'calc'], ['tentang', 'Tentang prototipe', 'info']]);
    App.sheet('Menu', '<nav class="stack sm" aria-label="Menu lainnya">' + sisa.map(function (n) {
      return '<a class="btn outline block" style="justify-content:flex-start" href="#/' + P.kode + '/' + n[0] + '">' + icon(n[2]) + esc(n[1]) + '</a>';
    }).join('') + '<button class="btn secondary block" style="justify-content:flex-start" data-act="menu-user">' + icon('sun') + 'Tema dan akun</button></nav>');
  };
  if (window.matchMedia) {
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { App.applyTheme(); }); } catch (e) { /* peramban lama */ }
  }
})();
