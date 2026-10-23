/* TERANG-KOP — layar Pengurus dan Pengawas. */
(function () {
  'use strict';
  var App = window.App, TK = window.TK, esc = App.esc, icon = App.icon, rp = App.rp, tgl = App.tgl;

  function semuaPinjaman() {
    return App.state.pinjaman.map(function (p) { var st = TK.statusPinjaman(App.state, p, App.today()); if (st) st.p = p; return st; }).filter(Boolean);
  }
  function fmtRibuan(n) { return isNaN(n) || n === null || n === undefined || n === '' ? '' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  /* ================= Beranda pengurus ================= */
  function stripPengurus() {
    var s = App.state, hari = App.today();
    var nr = TK.neraca(s.entri, hari, hari.slice(0, 4) + '-01-01');
    var pj = semuaPinjaman(), beredar = 0, tunggak = 0;
    pj.forEach(function (x) { beredar += x.sisa; if (x.status === 'Menunggak' || x.status === 'Terlambat') tunggak++; });
    var bln = s.entri.filter(function (e) { return e.tanggal.slice(0, 7) === hari.slice(0, 7); }).length;
    var sal = 0; s.anggota.forEach(function (a) { sal += TK.saldoAnggota(s, a.id).total; });
    var item = function (lbl, v, sub, cls) { return '<div class="kpi"><span class="label">' + lbl + '</span><b class="num' + (cls ? ' ' + cls : '') + '">' + v + '</b><span class="small body">' + sub + '</span></div>'; };
    return '<section class="card kpi-strip" aria-label="Angka kunci">' +
      item('Kas dan bank', rp(nr.kas + nr.bank), 'Kas ' + rp(nr.kas) + ' · bank ' + rp(nr.bank)) +
      item('Simpanan anggota', rp(sal), s.anggota.length + ' anggota') +
      item('Pinjaman beredar', rp(beredar), tunggak ? tunggak + ' pinjaman terlambat bayar' : 'Semua lancar', tunggak ? 'warn' : '') +
      item('Transaksi ' + TK.namaBulan(hari.slice(0, 7)), String(bln), 'dicatat sampai ' + tgl(hari)) + '</section>';
  }
  App.views['png/beranda'] = {
    title: 'Beranda',
    render: function () {
      var s = App.state, u = App.pengguna();
      var pb = TK.periodeBerjalan(s);
      var pv = pb ? TK.pratinjauSkor(s, pb.id, App.today()) : null;
      var pt = App.periodeTerbitTerakhir();
      var skT = pt ? App.skorDetail(pt.id) : null;
      var q = App.antreanAktif();
      var tunggak = semuaPinjaman().filter(function (x) { return x.status === 'Menunggak' || x.status === 'Terlambat'; });
      var tl = App.tiketTerbuka(s.koperasi.id);
      var tasks = [];
      var sebelum = TK.tgl.periodeSebelum(TK.tgl.periodeOf(App.today()));
      var pSeb = TK.cariPeriode(s, sebelum);
      if (pSeb && pSeb.status !== 'Terbit') {
        var lewat10 = App.today().slice(8, 10) > '10';
        tasks.push(['bad', 'clock', 'Laporan ' + TK.namaPeriode(sebelum) + ' belum terbit', (lewat10 ? 'Lewat tanggal 10. ' : 'Tenggat tanggal 10. ') + (pSeb.status === 'Terbuka' ? 'Tutup buku dulu.' : 'Menunggu pengesahan pengawas.'), pSeb.status === 'Terbuka' ? App.href('tutup') : null]);
      } else if (pSeb) tasks.push(['done', 'check', 'Laporan ' + TK.namaPeriode(sebelum) + ' terbit ' + tgl(pSeb.terbit_pada), 'Disahkan pengawas sebelum tanggal 10.', null]);
      if (q.length) tasks.push(['attn', 'refresh', q.length + ' entri di antrean luring', q.filter(function (x) { return x.status === 'Perlu ditinjau'; }).length + ' perlu ditinjau. Sinkronkan saat daring.', App.href('catat')]);
      tunggak.forEach(function (st) { tasks.push([st.status === 'Menunggak' ? 'bad' : 'attn', 'alert', 'Tagih ' + st.p.id + ' · ' + App.namaAnggota(st.p.anggota_id), st.tunggakan.length + ' angsuran tertunggak, ' + st.hari_tunggak + ' hari sejak ' + tgl(st.tunggakan[0].jatuh_tempo) + '.', App.href('catat') + '?j=T06&p=' + st.p.id]); });
      tl.forEach(function (t) { tasks.push([App.terlambat(t) ? 'bad' : 'attn', 'flag', t.id + ' · ' + t.jenis + ' · ' + t.status, 'Tenggat ' + tgl(t.tenggat) + (App.terlambat(t) ? ', terlambat.' : '.'), t.jenis !== 'Pendampingan' ? App.href('tiket', t.id) : null]); });
      if (s.rat.status === 'Dijadwalkan') tasks.push(['', 'vote', 'Terbitkan paket RAT', 'Paling lambat ' + tgl(TK.tgl.addDays(s.rat.tanggal, -7)) + ' (H-7 dari RAT ' + tgl(s.rat.tanggal) + ').', App.href('rat')]);
      if (pb) tasks.push(['', 'lock', 'Tutup buku ' + TK.namaPeriode(pb.id), 'Setelah semua transaksi bulan ini tercatat.', App.href('tutup')]);
      var taskHtml = tasks.map(function (t) {
        var inner = '<span class="ic">' + icon(t[1]) + '</span><span class="grow"><b>' + esc(t[2]) + '</b><span class="small body">' + esc(t[3]) + '</span></span>' + (t[4] ? icon('chevR') : '');
        return t[4] ? '<a class="task ' + t[0] + '" href="' + t[4] + '" style="text-decoration:none;color:inherit">' + inner + '</a>' : '<div class="task ' + t[0] + '">' + inner + '</div>';
      }).join('');
      return App.pageHead('Halo, ' + App.namaDepan(u.nama), 'Tugas bulan ini untuk ' + esc(s.koperasi.nama) + '.', '<a class="btn primary" href="' + App.href('catat') + '">' + icon('plus') + 'Catat transaksi</a>') +
        stripPengurus() +
        '<div class="grid g3" style="align-items:start"><section class="card span2" aria-labelledby="h-tugas"><h2 id="h-tugas" style="margin-bottom:12px">Tugas</h2><div class="tasks">' + taskHtml + '</div></section>' +
        '<div class="stack">' +
        (skT ? '<section class="card stack sm"><h2>Skor ' + TK.namaPeriode(pt.id) + '</h2><div class="row">' + App.gauge(skT.nilai, skT.status, true) + App.statusBadge(skT.status) + '</div><p class="small body">Laporan terakhir yang terbit ke anggota.</p></section>' : '') +
        (pv ? '<section class="card stack sm"><h2>Pratinjau ' + TK.namaPeriode(pb.id) + '</h2><div class="row">' + App.gauge(pv.skor.nilai, pv.skor.status, true) + App.statusBadge(pv.skor.status) + '</div>' +
          App.ui.alasanSkor(pv.skor, 2) + '<p class="xs mute">Dihitung dari buku besar sampai hari ini; belum terkunci.</p><a class="btn outline sm" href="' + App.href('tutup') + '">Lihat pratinjau lengkap</a></section>' : '') +
        '</div></div>';
    }
  };

  /* ================= Catat transaksi ================= */
  var GRUP = [['Simpanan anggota', ['T01', 'T02', 'T03', 'T04']], ['Pinjaman anggota', ['T05', 'T06']], ['Gerai', ['T07', 'T08']], ['Operasional dan bank', ['T09', 'T10', 'T11', 'T12']]];
  var BAWAAN = { T01: 100000, T02: 25000 };
  function draftAwal(r) {
    var q = (r && r.q) || {};
    var d = { jenis: q.j || 'T02', tanggal: App.today(), anggota_id: '', pinjaman_id: q.p || '', nominal: BAWAAN[q.j || 'T02'] || '', pokok: '', jasa: '', tenor: 10, jasa_persen: 1.5, uraian: '' };
    if (d.pinjaman_id) {
      var p = App.state.pinjaman.filter(function (x) { return x.id === d.pinjaman_id; })[0];
      if (p) { d.anggota_id = p.anggota_id; isiTunggakan(d); }
    }
    return d;
  }
  function isiTunggakan(d) {
    var p = App.state.pinjaman.filter(function (x) { return x.id === d.pinjaman_id; })[0];
    if (!p) return;
    var st = TK.statusPinjaman(App.state, p, App.today());
    if (st.tunggakan.length) { d.pokok = st.tunggakan.reduce(function (a, j) { return a + j.pokok; }, 0); d.jasa = st.tunggakan.reduce(function (a, j) { return a + j.jasa; }, 0); }
    else if (st.berikut) { d.pokok = st.berikut.pokok; d.jasa = st.berikut.jasa; }
  }
  function bacaDraft(f) {
    var d = App.formData(f), j = d.jenis;
    var out = { jenis: j, tanggal: d.tanggal, uraian: (d.uraian || '').trim() };
    if (TK.JENIS[j] && TK.JENIS[j].anggota) out.anggota_id = d.anggota_id || '';
    if (j === 'T06' || j === 'T11') { out.pokok = App.angka(d.pokok); out.jasa = App.angka(d.jasa); }
    else out.nominal = App.angka(d.nominal);
    if (j === 'T06') out.pinjaman_id = d.pinjaman_id || '';
    if (j === 'T05') { out.tenor = parseInt(d.tenor, 10); out.jasa_persen = parseFloat(String(d.jasa_persen).replace(',', '.')); }
    return out;
  }
  function pratinjauJurnal(draft) {
    var v = TK.validasi(App.state, draft);
    var baris = v.baris && v.baris.length && v.baris.every(function (b) { return !isNaN(b.debit) && !isNaN(b.kredit); }) ? v.baris : null;
    if (!baris || (!(draft.nominal > 0) && !((draft.pokok || 0) + (draft.jasa || 0) > 0))) return '<p class="body">Isi nominal untuk melihat jurnal.</p>';
    var d = 0, k = 0;
    var rows = baris.map(function (b) { d += b.debit || 0; k += b.kredit || 0; return '<tr><td class="mono">' + b.akun + '</td><td>' + esc(TK.AKUN[b.akun].nama) + '</td><td class="r">' + (b.debit ? rp(b.debit) : '') + '</td><td class="r">' + (b.kredit ? rp(b.kredit) : '') + '</td></tr>'; }).join('');
    return '<div class="table-wrap"><table class="t"><thead><tr><th>Akun</th><th>Nama</th><th class="r">Debit</th><th class="r">Kredit</th></tr></thead><tbody>' + rows +
      '<tr><td></td><td class="strong">Jumlah</td><td class="r strong">' + rp(d) + '</td><td class="r strong">' + rp(k) + '</td></tr></tbody></table></div>' +
      '<p class="ind ' + (d === k ? 'hijau' : 'merah') + '" style="margin-top:8px">' + icon(d === k ? 'checkCircle' : 'alert', 'sm') + (d === k ? 'Debit sama dengan kredit' : 'Debit dan kredit tidak seimbang') + '</p>' +
      (v.ok ? '' : '<p class="small mute" style="margin-top:4px">' + esc(v.galat[0].pesan) + '</p>');
  }
  function fieldErr(galat, nama) {
    var g = (galat || []).filter(function (x) { return x.field === nama; })[0];
    return g ? '<span class="err" id="err-' + nama + '">' + icon('alert', 'sm') + '<span>' + esc(g.pesan) + '</span></span>' : '';
  }
  function inv(galat, nama) { return (galat || []).some(function (x) { return x.field === nama; }) ? ' aria-invalid="true" aria-describedby="err-' + nama + '"' : ''; }

  App.views['png/catat'] = {
    title: 'Catat transaksi',
    render: function (r) {
      var s = App.state;
      if (!App._catat || App._catatRoute !== location.hash) { App._catat = draftAwal(r); App._catatGalat = null; App._catatRoute = location.hash; }
      var d = App._catat, g = App._catatGalat, def = TK.JENIS[d.jenis];
      var opsiJenis = GRUP.map(function (gr) { return '<optgroup label="' + gr[0] + '">' + gr[1].map(function (k) { return '<option value="' + k + '"' + (k === d.jenis ? ' selected' : '') + '>' + k + ' · ' + TK.JENIS[k].nama + '</option>'; }).join('') + '</optgroup>'; }).join('');
      var opsiAnggota = '<option value="">Pilih anggota</option>' + s.anggota.map(function (a) { return '<option value="' + a.id + '"' + (a.id === d.anggota_id ? ' selected' : '') + '>' + esc(a.nama) + ' · ' + a.no + '</option>'; }).join('');
      var f = '';
      f += '<div class="field full"><label for="c-jenis">Jenis transaksi</label><select class="input" id="c-jenis" name="jenis" data-change="catat-ulang">' + opsiJenis + '</select><span class="hint">Debit ' + esc(def.d) + ', kredit ' + esc(def.k) + '.</span></div>';
      if (def.anggota) f += '<div class="field full"><label for="c-ang">Anggota</label><select class="input" id="c-ang" name="anggota_id" data-change="catat-ulang"' + inv(g, 'anggota_id') + '>' + opsiAnggota + '</select>' + fieldErr(g, 'anggota_id') +
        (d.jenis === 'T04' && d.anggota_id ? '<span class="hint">Saldo sukarela: ' + rp(TK.saldoAnggota(s, d.anggota_id).sukarela) + '</span>' : '') + '</div>';
      if (d.jenis === 'T06') {
        var pjs = s.pinjaman.filter(function (p) { return p.anggota_id === d.anggota_id; }).map(function (p) { var st = TK.statusPinjaman(s, p, App.today()); st.p = p; return st; }).filter(function (x) { return x.status !== 'Lunas'; });
        f += '<div class="field full"><label for="c-pj">Pinjaman</label><select class="input" id="c-pj" name="pinjaman_id" data-change="catat-pinjaman"' + inv(g, 'pinjaman_id') + '>' +
          (d.anggota_id ? (pjs.length ? '<option value="">Pilih pinjaman</option>' + pjs.map(function (st) { return '<option value="' + st.p.id + '"' + (st.p.id === d.pinjaman_id ? ' selected' : '') + '>' + st.p.id + ' · sisa ' + rp(st.sisa) + ' · ' + st.status + '</option>'; }).join('') : '<option value="">Anggota ini tidak punya pinjaman berjalan</option>') : '<option value="">Pilih anggota dulu</option>') +
          '</select>' + fieldErr(g, 'pinjaman_id');
        var stp = pjs.filter(function (x) { return x.p.id === d.pinjaman_id; })[0];
        if (stp) f += '<div class="row" style="margin-top:4px">' + App.ui.badgePinjaman(stp) + (stp.tunggakan.length ? '<button type="button" class="btn ghost sm" data-act="isi-tunggakan">Isi ' + stp.tunggakan.length + ' angsuran tertunggak</button>' : '') + (stp.berikut ? '<button type="button" class="btn ghost sm" data-act="isi-satu">Isi satu angsuran (' + rp(stp.berikut.total) + ')</button>' : '') + '</div>';
        f += '</div>';
      }
      if (d.jenis === 'T06' || d.jenis === 'T11') {
        f += '<div class="field"><label for="c-pokok">Pokok</label><div class="money"><span>Rp</span><input class="input" id="c-pokok" name="pokok" inputmode="numeric" autocomplete="off" value="' + fmtRibuan(d.pokok) + '"' + inv(g, 'pokok') + '></div>' + fieldErr(g, 'pokok') + '</div>' +
          '<div class="field"><label for="c-jasa">' + (d.jenis === 'T06' ? 'Jasa' : 'Bunga') + '</label><div class="money"><span>Rp</span><input class="input" id="c-jasa" name="jasa" inputmode="numeric" autocomplete="off" value="' + fmtRibuan(d.jasa) + '"' + inv(g, 'jasa') + '></div>' + fieldErr(g, 'jasa') + '</div>';
      } else {
        f += '<div class="field full"><label for="c-nom">Nominal</label><div class="money"><span>Rp</span><input class="input" id="c-nom" name="nominal" inputmode="numeric" autocomplete="off" value="' + fmtRibuan(d.nominal) + '"' + inv(g, 'nominal') + '></div><span class="hint">Bilangan bulat rupiah tanpa sen.</span>' + fieldErr(g, 'nominal') + '</div>';
      }
      if (d.jenis === 'T05') {
        f += '<div class="field"><label for="c-tenor">Tenor (bulan)</label><input class="input" id="c-tenor" name="tenor" type="number" min="1" max="36" value="' + esc(d.tenor) + '"' + inv(g, 'tenor') + '>' + fieldErr(g, 'tenor') + '</div>' +
          '<div class="field"><label for="c-jp">Jasa per bulan (%)</label><input class="input" id="c-jp" name="jasa_persen" inputmode="decimal" value="' + esc(String(d.jasa_persen).replace('.', ',')) + '"' + inv(g, 'jasa_persen') + '>' + fieldErr(g, 'jasa_persen') + '</div>';
      }
      f += '<div class="field"><label for="c-tgl">Tanggal</label><input class="input" id="c-tgl" name="tanggal" type="date" value="' + esc(d.tanggal) + '" max="' + App.today() + '"' + inv(g, 'tanggal') + '>' + fieldErr(g, 'tanggal') + '</div>' +
        '<div class="field"><label for="c-ur">Uraian <span class="mute">(opsional)</span></label><input class="input" id="c-ur" name="uraian" value="' + esc(d.uraian) + '" placeholder="Contoh: ' + esc(def.nama) + '…" autocomplete="off"></div>';
      var q = App.antreanAktif();
      var antrean = q.length ? '<div class="list">' + q.map(function (it, i) {
        var dr = it.draft, n = dr.nominal || ((dr.pokok || 0) + (dr.jasa || 0));
        return '<div class="li"><div class="grow"><b>' + esc(dr.uraian || TK.JENIS[dr.jenis].nama) + '</b><div class="small mute">' + dr.jenis + ' · ' + tgl(dr.tanggal) + (dr.anggota_id ? ' · ' + esc(App.namaAnggota(dr.anggota_id)) : '') + ' · ' + rp(n) + '</div>' +
          (it.status === 'Perlu ditinjau' ? '<div class="err" style="margin-top:4px">' + icon('alert', 'sm') + '<span>' + esc((it.galat || [{ pesan: '' }])[0].pesan) + '</span></div>' : '') + '</div>' +
          '<div class="stack sm" style="align-items:flex-end">' + App.chip(it.status, it.status === 'Perlu ditinjau' ? 'late' : 'amber', it.status === 'Perlu ditinjau' ? 'alert' : 'clock') +
          (it.status === 'Perlu ditinjau' ? '<div class="row"><button class="btn ghost sm" data-act="antre-perbaiki" data-i="' + i + '">Perbaiki</button><button class="btn ghost sm" data-act="antre-buang" data-i="' + i + '">Buang</button></div>' : '') + '</div></div>';
      }).join('') + '</div>' : '<p class="body">Antrean kosong. Saat luring, transaksi yang Anda simpan muncul di sini bertanda Menunggu sinkron.</p>';
      var menunggu = q.filter(function (x) { return x.status === 'Menunggu sinkron'; }).length;
      var terakhir = s.entri.slice(-3).reverse();
      return App.pageHead('Catat transaksi', 'Satu transaksi per simpan. Jurnal dibentuk otomatis dari jenis transaksi.') +
        (!s.online ? '<div style="margin-bottom:16px">' + App.callout('warn', 'wifiOff', '<p><b>Anda sedang luring.</b> Transaksi disimpan di antrean perangkat dengan ID klien unik dan dikirim saat daring. Aturan saldo diperiksa ulang saat sinkron.</p>') + '</div>' : '') +
        '<div class="grid g3" style="align-items:start"><form class="card span2 stack lg" data-form="catat" data-input="catat" novalidate>' +
        (App._catatPerbaiki ? App.callout('info', 'edit', '<p>Memperbaiki entri dari antrean. Simpan untuk mengirim ulang.</p>') : '') +
        '<div class="form-grid">' + f + '</div>' +
        '<div class="card tint" style="padding:18px"><h3 style="margin-bottom:8px">Pratinjau jurnal</h3><div id="jurnal-preview" aria-live="polite">' + pratinjauJurnal(bacaDraftDari(d)) + '</div></div>' +
        '<div class="row"><button class="btn primary" type="submit">' + icon(s.online ? 'check' : 'clock') + (s.online ? 'Simpan transaksi' : 'Simpan ke antrean') + '</button><button class="btn outline" type="button" data-act="catat-reset">Kosongkan</button></div></form>' +
        '<div class="stack"><section class="card"><div class="card-head"><h2>Antrean luring</h2>' + (q.length ? App.chip(q.length + ' entri', 'amber') : '') + '</div>' + antrean +
        (menunggu ? '<button class="btn ' + (s.online ? 'primary' : 'secondary') + ' block" style="margin-top:12px" data-act="sinkron"' + (s.online ? '' : ' disabled aria-disabled="true"') + '>' + icon('refresh') + (s.online ? 'Sinkronkan sekarang' : 'Menunggu sinyal') + '</button>' : '') + '</section>' +
        '<section class="card"><h2 style="margin-bottom:8px">Tercatat terakhir</h2><div class="list">' + terakhir.map(function (e) { return '<a class="li" href="' + App.href('buku', e.id) + '" style="color:inherit;text-decoration:none"><div class="grow"><b class="small">' + esc(e.uraian) + '</b><div class="xs mute">' + e.id + ' · ' + tgl(e.tanggal) + '</div></div><span class="amt small">' + rp(App.ui.nominalEntri(e)) + '</span></a>'; }).join('') + '</div></section></div></div>';
    }
  };
  function bacaDraftDari(d) {
    var o = { jenis: d.jenis, tanggal: d.tanggal, anggota_id: d.anggota_id, uraian: d.uraian };
    if (d.jenis === 'T06' || d.jenis === 'T11') { o.pokok = typeof d.pokok === 'number' ? d.pokok : App.angka(d.pokok); o.jasa = typeof d.jasa === 'number' ? d.jasa : App.angka(d.jasa); o.pinjaman_id = d.pinjaman_id; }
    else o.nominal = typeof d.nominal === 'number' ? d.nominal : App.angka(d.nominal);
    if (d.jenis === 'T05') { o.tenor = +d.tenor; o.jasa_persen = +d.jasa_persen; }
    return o;
  }
  function simpanForm(f) { var d = App.formData(f); Object.keys(d).forEach(function (k) { App._catat[k] = d[k]; }); }
  App.inputs.catat = function (f, e) {
    if (e.target.closest('.money input')) {
      var el = e.target, raw = el.value.replace(/\D/g, '');
      var pos = el.value.length - el.selectionStart;
      el.value = raw ? fmtRibuan(+raw) : '';
      try { var p = Math.max(0, el.value.length - pos); el.setSelectionRange(p, p); } catch (x) { /* abaikan */ }
    }
    simpanForm(f);
    document.getElementById('jurnal-preview').innerHTML = pratinjauJurnal(bacaDraft(f));
  };
  App.acts['catat-ulang'] = function (el) {
    var f = el.form, prevJ = App._catat.jenis; simpanForm(f);
    if (el.name === 'jenis' && prevJ !== App._catat.jenis) { App._catat.nominal = BAWAAN[App._catat.jenis] || ''; App._catat.pokok = ''; App._catat.jasa = ''; App._catat.pinjaman_id = ''; }
    if (el.name === 'anggota_id') App._catat.pinjaman_id = '';
    App._catatGalat = null; App._focusNext = false; App.render(); App._focusNext = true;
    var n = document.querySelector('[name="' + el.name + '"]'); if (n) n.focus();
  };
  App.acts['catat-pinjaman'] = function (el) { simpanForm(el.form); isiTunggakan(App._catat); App._focusNext = false; App.render(); App._focusNext = true; var n = document.getElementById('c-pj'); if (n) n.focus(); };
  App.acts['isi-tunggakan'] = function () { simpanForm(document.querySelector('[data-form="catat"]')); isiTunggakan(App._catat); App._focusNext = false; App.render(); App._focusNext = true; };
  App.acts['isi-satu'] = function () {
    simpanForm(document.querySelector('[data-form="catat"]'));
    var p = App.state.pinjaman.filter(function (x) { return x.id === App._catat.pinjaman_id; })[0];
    var st = TK.statusPinjaman(App.state, p, App.today()); var j = st.tunggakan[0] || st.berikut;
    App._catat.pokok = j.pokok; App._catat.jasa = j.jasa; App._focusNext = false; App.render(); App._focusNext = true;
  };
  App.acts['catat-reset'] = function () { App._catat = draftAwal({ q: {} }); App._catat.jenis = App._catat.jenis; App._catatGalat = null; App._catatPerbaiki = null; App._focusNext = false; App.render(); App._focusNext = true; };
  App.forms.catat = function (f) {
    var s = App.state, draft = bacaDraft(f);
    draft.cid = (App._catatPerbaiki && App._catatPerbaiki.cid) || App.uid();
    if (!draft.uraian) delete draft.uraian;
    var v = TK.validasi(s, draft);
    var fokusGalat = function (galat) {
      App._catatGalat = galat; simpanForm(f); App._focusNext = false; App.render(); App._focusNext = true;
      var el = document.querySelector('[aria-invalid="true"]'); if (el) el.focus();
      App.toast(galat[0].pesan, 'bad');
    };
    if (!s.online) {
      if (!v.ok && !v.tinjau) { fokusGalat(v.galat); return; }
      s.antrean.push({ cid: draft.cid, draft: draft, status: 'Menunggu sinkron', dibuat: App.today() });
      App.save(); App._catatPerbaiki = null; App._catat = draftAwal({ q: {} }); App._catat.jenis = draft.jenis; App._catat.nominal = BAWAAN[draft.jenis] || ''; App._catatGalat = null;
      App.toast('Tersimpan di antrean: Menunggu sinkron.'); App._focusNext = false; App.render(); App._focusNext = true; return;
    }
    if (!v.ok) { fokusGalat(v.galat); return; }
    var r = TK.tambahEntri(s, draft, 'PNG');
    if (!r.ok) { fokusGalat(r.galat); return; }
    App.save(); App._catatPerbaiki = null; App._catatGalat = null;
    App._catat = draftAwal({ q: {} }); App._catat.jenis = draft.jenis; App._catat.nominal = BAWAAN[draft.jenis] || '';
    App.toast('Tersimpan sebagai ' + r.entri.id + '.'); App._focusNext = false; App.render(); App._focusNext = true;
  };
  App.sinkronkan = function () {
    var s = App.state;
    var kirim = s.antrean.filter(function (q) { return q.status === 'Menunggu sinkron'; }).map(function (q) { return JSON.parse(JSON.stringify(q.draft)); });
    var h = TK.sinkron(s, 'PNG');
    s._terkirim = (s._terkirim || []).concat(kirim.filter(function (d) { return h.masuk.some(function (e) { return e.cid === d.cid; }); })).slice(-10);
    App.save();
    var msg = h.masuk.length + ' entri masuk buku besar';
    if (h.tinjau.length) msg += ', ' + h.tinjau.length + ' perlu ditinjau';
    if (h.duplikat.length) msg += ', ' + h.duplikat.length + ' sudah pernah tersinkron dan tidak digandakan';
    App.toast(msg + '.', h.tinjau.length ? 'bad' : '');
    return h;
  };
  App.acts.sinkron = function () { if (!App.state.online) return; App.sinkronkan(); App._focusNext = false; App.render(); App._focusNext = true; };
  App.acts['antre-perbaiki'] = function (el) {
    var i = +el.getAttribute('data-i'), it = App.state.antrean[i];
    App.state.antrean.splice(i, 1); App.save();
    var d = it.draft;
    App._catat = { jenis: d.jenis, tanggal: d.tanggal, anggota_id: d.anggota_id || '', pinjaman_id: d.pinjaman_id || '', nominal: d.nominal || '', pokok: d.pokok || '', jasa: d.jasa || '', tenor: d.tenor || 10, jasa_persen: d.jasa_persen || 1.5, uraian: d.uraian || '' };
    App._catatPerbaiki = { cid: it.cid }; App._catatGalat = it.galat; App._focusNext = false; App.render(); App._focusNext = true;
    var e = document.querySelector('[aria-invalid="true"]'); if (e) e.focus();
  };
  App.acts['antre-buang'] = function (el) {
    var i = +el.getAttribute('data-i'), it = App.state.antrean[i];
    App.confirm({ judul: 'Buang entri antrean?', tombol: 'Buang entri', bahaya: true, isi: '<p>' + esc(it.draft.uraian || TK.JENIS[it.draft.jenis].nama) + ' tidak akan masuk buku besar. Entri antrean belum tercatat, jadi tidak ada jejak di rantai hash.</p>' }).then(function (ok) {
      if (!ok) return; App.state.antrean.splice(i, 1); App.save(); App.toast('Entri antrean dibuang.'); App.render();
    });
  };

  /* ================= Anggota dan pinjaman ================= */
  App.views['png/anggota'] = {
    title: 'Anggota dan pinjaman',
    render: function (r) {
      if (r.arg) return detailAnggota(r.arg);
      var s = App.state, tab = (r.q && r.q.t) || 'anggota';
      var seg = '<div class="row" role="group" aria-label="Tampilan">' + [['anggota', 'Anggota (' + s.anggota.length + ')'], ['pinjaman', 'Pinjaman (' + s.pinjaman.length + ')']].map(function (x) {
        return '<a class="btn sm ' + (tab === x[0] ? 'dark' : 'secondary') + '" href="' + App.href('anggota') + '?t=' + x[0] + '"' + (tab === x[0] ? ' aria-current="true"' : '') + '>' + x[1] + '</a>';
      }).join('') + '</div>';
      var isi;
      if (tab === 'pinjaman') {
        isi = '<div class="table-wrap"><table class="t stackable"><thead><tr><th>Pinjaman</th><th>Anggota</th><th class="r">Pokok</th><th class="r">Sisa</th><th>Status</th><th>Berikutnya</th><th></th></tr></thead><tbody>' +
          semuaPinjaman().map(function (st) {
            return '<tr><td class="mono strong">' + st.p.id + '</td><td>' + esc(App.namaAnggota(st.p.anggota_id)) + '</td><td class="r" data-hide-m>' + rp(st.p.pokok) + '</td><td class="r strong">' + rp(st.sisa) + '</td><td>' + App.ui.badgePinjaman(st) + '</td>' +
              '<td data-hide-m class="small">' + (st.berikut ? tgl(st.berikut.jatuh_tempo) + ' · ' + rp(st.berikut.total) : '—') + '</td><td>' + (st.status !== 'Lunas' ? '<a class="btn ghost sm" href="' + App.href('catat') + '?j=T06&p=' + st.p.id + '">Catat angsuran</a>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      } else {
        isi = '<div class="table-wrap"><table class="t stackable"><thead><tr><th>Anggota</th><th class="r">Pokok</th><th class="r">Wajib</th><th class="r">Sukarela</th><th>Pinjaman</th></tr></thead><tbody>' +
          s.anggota.map(function (a) {
            var sal = TK.saldoAnggota(s, a.id);
            var pj = semuaPinjaman().filter(function (x) { return x.p.anggota_id === a.id && x.status !== 'Lunas'; });
            return '<tr class="click" data-act="buka-anggota" data-id="' + a.id + '"><td><a class="strong" href="' + App.href('anggota', a.id) + '">' + esc(a.nama) + '</a><div class="xs mute">' + a.no + (a.jabatan ? ' · ' + a.jabatan : '') + '</div></td>' +
              '<td class="r" data-hide-m>' + rp(sal.pokok) + '</td><td class="r" data-hide-m>' + rp(sal.wajib) + '</td><td class="r">' + rp(sal.sukarela) + '</td><td>' + (pj.length ? pj.map(App.ui.badgePinjaman).join(' ') : '<span class="small mute">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      return App.pageHead('Anggota dan pinjaman', 'Membuka rincian anggota tercatat di log audit yang bisa dilihat anggota tersebut.', '<a class="btn primary" href="' + App.href('catat') + '?j=T05">' + icon('plus') + 'Cairkan pinjaman</a>') +
        '<div class="card"><div style="margin-bottom:12px">' + seg + '</div>' + isi + '</div>';
    }
  };
  App.acts['buka-anggota'] = function (el, e) { if (e.target.closest('a')) return; App.go('anggota', el.getAttribute('data-id')); };
  function detailAnggota(id) {
    var s = App.state, a = App.anggota(id);
    if (!a) return App.pageHead('Anggota tidak ditemukan', null, null, [App.href('anggota'), 'Anggota dan pinjaman']);
    App.audit('Membuka rincian anggota ' + a.no, a.id);
    var sal = TK.saldoAnggota(s, id);
    var pj = semuaPinjaman().filter(function (x) { return x.p.anggota_id === id; });
    var ent = s.entri.filter(function (e) { return e.anggota_id === id; }).slice(-10).reverse();
    return App.pageHead(a.nama, a.no + (a.jabatan ? ' · ' + a.jabatan : '') + ' · bergabung ' + App.tglPanjang(a.bergabung), '<a class="btn outline" href="' + App.href('anggota', id) + '?cetak=1" data-act="cetak-anggota" data-id="' + id + '">' + icon('print') + 'Ringkasan cetak</a>', [App.href('anggota'), 'Anggota dan pinjaman']) +
      '<div class="stack lg"><div class="grid g2"><div class="card"><h2>Simpanan</h2><p class="big" style="margin:8px 0 14px">' + rp(sal.total) + '</p><div class="kv"><div><span class="label">Pokok</span><b>' + rp(sal.pokok) + '</b></div><div><span class="label">Wajib</span><b>' + rp(sal.wajib) + '</b></div><div><span class="label">Sukarela</span><b>' + rp(sal.sukarela) + '</b></div></div></div>' +
      '<div class="card stack sm"><h2>Pinjaman</h2>' + (pj.length ? pj.map(function (st) { return '<div class="row between"><span><b class="mono">' + st.p.id + '</b> sisa ' + rp(st.sisa) + '</span>' + App.ui.badgePinjaman(st) + '</div>'; }).join('') : '<p class="body">Tidak ada pinjaman.</p>') + '</div></div>' +
      '<div class="card"><h2 style="margin-bottom:8px">Transaksi terakhir</h2><div class="list">' + ent.map(function (e) { return '<a class="li" style="color:inherit;text-decoration:none" href="' + App.href('buku', e.id) + '"><div class="grow"><b>' + esc(e.uraian) + '</b><div class="small mute">' + e.id + ' · ' + tgl(e.tanggal) + '</div></div><span class="amt">' + rp(App.ui.nominalEntri(e)) + '</span></a>'; }).join('') + '</div></div></div>';
  }
  App.acts['cetak-anggota'] = function (el) { App.modal('Ringkasan cetak A5', App.ui.lembarA5(el.getAttribute('data-id')), '<button class="btn primary" data-act="cetak">' + icon('print') + 'Cetak ringkasan</button>'); };

  /* ================= Tutup buku ================= */
  App.ui.tabelPeriode = function () {
    var s = App.state;
    return '<div class="table-wrap"><table class="t stackable"><thead><tr><th>Periode</th><th>Status</th><th class="r">Skor</th><th>Ditutup</th><th>Terbit</th></tr></thead><tbody>' +
      s.periode.slice().reverse().map(function (p) {
        var rec = s.skor.filter(function (x) { return x.periode_id === p.id; })[0];
        var telat = p.terbit_pada && !App.tepatWaktu({ periode: p.id, terbit_pada: p.terbit_pada });
        return '<tr><td class="strong">' + TK.namaPeriode(p.id) + '</td><td>' + App.chip(p.status, p.status === 'Terbit' ? '' : 'amber') + '</td><td class="r">' + (rec ? '<b>' + rec.nilai + '</b> ' + App.statusBadge(rec.status) : '—') + '</td>' +
          '<td data-hide-m class="num">' + tgl(p.ditutup_pada) + '</td><td class="num">' + tgl(p.terbit_pada) + (telat ? ' ' + App.chip('Lewat tanggal 10', 'late') : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  };
  App.views['png/tutup'] = {
    title: 'Tutup buku',
    render: function () {
      var s = App.state, pb = TK.periodeBerjalan(s);
      var hasil = App._hasilTutup;
      var ditutup = s.periode.filter(function (p) { return p.status === 'Ditutup'; });
      var top = '';
      if (hasil) {
        top = '<div class="stack">' + App.callout('ok', 'checkCircle', '<p><b>Buku ' + TK.namaPeriode(hasil.periode) + ' ditutup.</b> Skor ' + hasil.nilai + ', ' + esc(hasil.status) + '. Laporan menunggu pengesahan pengawas sebelum terbit ke anggota.</p>' +
          (hasil.tiket.length ? '<p style="margin-top:6px">Tiket dibuat: ' + hasil.tiket.map(function (t) { return '<b>' + t.id + '</b> ' + esc(t.jenis) + ', tenggat ' + tgl(t.tenggat); }).join('; ') + '.</p>' : '')) + '</div>';
      }
      if (!pb) return App.pageHead('Tutup buku') + top + App.empty('lock', 'Tidak ada periode terbuka', 'Semua periode sudah ditutup.');
      var pv = TK.pratinjauSkor(s, pb.id, App.today());
      var q = App.antreanAktif().filter(function (x) { return TK.tgl.periodeOf(x.draft.tanggal) === pb.id; });
      var jml = s.entri.filter(function (e) { return e.tanggal.slice(0, 7) === pb.id; }).length;
      var cek = [
        [q.length === 0, q.length ? q.length + ' entri ' + TK.namaBulan(pb.id) + ' masih di antrean' : 'Antrean luring kosong'],
        [true, jml + ' entri bertanggal ' + TK.namaBulan(pb.id) + ' di buku besar'],
        [!ditutup.length, ditutup.length ? 'Laporan ' + TK.namaPeriode(ditutup[0].id) + ' belum disahkan pengawas' : 'Laporan sebelumnya sudah terbit']
      ];
      return App.pageHead('Tutup buku ' + TK.namaPeriode(pb.id), 'Setelah ditutup, skor dihitung dari buku besar dan dikunci. Entri baru bertanggal ' + TK.namaBulan(pb.id) + ' tidak dapat ditambah.') +
        '<div class="stack lg">' + top +
        App.ui.ringkasSkor(pv.skor, 'Pratinjau skor ' + TK.namaPeriode(pb.id), App.chip('Belum terkunci', 'amber')) +
        '<div class="card"><h2 style="margin-bottom:12px">Pemeriksaan</h2><div class="tasks">' + cek.map(function (c) { return '<div class="task ' + (c[0] ? 'done' : 'attn') + '"><span class="ic">' + icon(c[0] ? 'check' : 'alert') + '</span><span class="grow">' + esc(c[1]) + '</span></div>'; }).join('') + '</div>' +
        '<button class="btn primary" style="margin-top:16px" data-act="tutup-buku" data-p="' + pb.id + '"' + (q.length ? ' disabled aria-disabled="true"' : '') + '>' + icon('lock') + 'Tutup buku ' + TK.namaBulan(pb.id) + '</button>' +
        '<p class="xs mute" style="margin-top:8px">Di produk sesungguhnya tombol aktif mulai hari kerja pertama bulan berikutnya. Prototipe mengizinkan tutup buku kapan saja untuk demonstrasi.</p></div>' +
        '<div class="card"><h2 style="margin-bottom:12px">Rincian indikator</h2>' + App.ui.tabelIndikator(pv.skor) + '</div>' +
        '<div class="card"><h2 style="margin-bottom:12px">Riwayat periode</h2>' + App.ui.tabelPeriode() + '</div></div>';
    }
  };
  App.acts['tutup-buku'] = function (el) {
    var pid = el.getAttribute('data-p'), pv = TK.pratinjauSkor(App.state, pid, App.today());
    var akibat = pv.skor.status === 'Perlu tindakan' ? 'Status Perlu tindakan akan membuat tiket Tindak lanjut untuk pengurus dengan tenggat 14 hari; penjelasan tertulis kepada anggota wajib.' :
      pv.skor.status === 'Waspada' ? 'Status Waspada akan membuat tiket Pendampingan untuk pendamping KJDP.' : 'Tidak ada tiket yang dibuat.';
    App.confirm({ judul: 'Tutup buku ' + TK.namaPeriode(pid) + '?', tombol: 'Tutup buku ' + TK.namaBulan(pid),
      isi: '<p>Skor ' + pv.skor.nilai + ' (' + esc(pv.skor.status) + ') dikunci bersama sidik jari catatan terakhir buku besar. Entri bertanggal ' + TK.namaBulan(pid) + ' tidak dapat ditambah lagi; koreksi memakai entri pembalik di bulan berikutnya.</p><p>' + akibat + '</p>' }).then(function (ok) {
      if (!ok) return;
      var r = TK.tutupBuku(App.state, pid, 'PNG');
      if (!r.ok) { App.toast(r.pesan, 'bad'); return; }
      App.save();
      App._hasilTutup = { periode: pid, nilai: r.skor.nilai, status: r.skor.status, tiket: r.tiket };
      App.toast('Buku ' + TK.namaPeriode(pid) + ' ditutup.');
      App.render();
    });
  };

  /* ================= RAT (pengurus kelola, pengawas baca) ================= */
  function viewRAT(kelola) {
    var s = App.state, rat = s.rat;
    var hMin = TK.tgl.diffDays(rat.tanggal, App.today());
    var batasPaket = TK.tgl.addDays(rat.tanggal, -7);
    var tahap = ['Dijadwalkan', 'Paket terbit', 'Berlangsung', 'Selesai'], iT = tahap.indexOf(rat.status);
    var stepper = '<ol class="row" style="list-style:none;padding:0;margin:0;gap:8px">' + tahap.map(function (t, i) {
      return '<li class="chip' + (i === iT ? ' amber' : '') + '">' + icon(i < iT ? 'check' : i === iT ? 'clock' : 'more', 'sm') + t + '</li>';
    }).join('') + '</ol>';
    var blok = [];
    blok.push('<div class="card stack"><div class="row between"><div><span class="label">RAT ' + App.tglPanjang(rat.tanggal) + '</span><p class="mid" style="margin-top:4px">' + esc(rat.status) + '</p></div>' + (rat.status === 'Dijadwalkan' ? App.chip(hMin + ' hari lagi', 'amber', 'calendar') : '') + '</div>' + stepper +
      '<p class="small body">Kuorum: ' + esc(rat.kuorum_aturan) + ' (' + TK.kuorumRAT(s).perlu + ' dari ' + s.anggota.length + '). Dapat diubah sesuai anggaran dasar.</p></div>');
    if (rat.status === 'Dijadwalkan') {
      var lewat = App.today() > batasPaket;
      blok.push('<div class="card stack"><h2>Paket laporan</h2><p class="body">Paket berisi laporan terbit terakhir (' + (App.periodeTerbitTerakhir() ? TK.namaPeriode(App.periodeTerbitTerakhir().id) : '—') + '), usulan SHU, dan agenda. Tenggat terbit ' + App.tglPanjang(batasPaket) + ' (H-7).</p>' +
        (lewat ? App.callout('bad', 'clock', '<p>Tenggat H-7 sudah lewat. Paket tetap bisa diterbitkan, tetapi tercatat terlambat untuk indikator K3.</p>') : '') +
        (kelola ? '<div><button class="btn primary" data-act="terbit-paket">' + icon('lock') + 'Terbitkan paket RAT</button></div>' : '<p class="small mute">Paket diterbitkan oleh pengurus.</p>') + '</div>');
    }
    if (rat.paket) {
      var baca = s.anggota.map(function (a) { return { a: a, t: rat.dibaca[a.id] }; });
      var sudah = baca.filter(function (x) { return x.t; });
      blok.push('<div class="card stack"><div class="card-head"><h2>Paket terkunci</h2>' + App.chip('H-' + rat.paket.h_minus, rat.paket.h_minus >= 7 ? '' : 'late') + '</div>' +
        '<p class="body">Terbit ' + App.tglPanjang(rat.paket.terbit_pada) + '. Hash <span class="hash">' + App.pendek(rat.paket.hash, 16) + '</span>. ' + (TK.periksaPaket(rat) ? '<span class="ind hijau">' + icon('check', 'sm') + 'Isi cocok dengan hash</span>' : '<span class="ind merah">' + icon('alert', 'sm') + 'Isi tidak cocok</span>') + '</p>' +
        '<div class="row"><button class="btn outline sm" data-act="lihat-paket">' + icon('book') + 'Lihat isi paket</button></div>' +
        '<h3>Pelacakan baca: ' + sudah.length + ' dari ' + s.anggota.length + ' anggota</h3><div class="bar" style="height:10px"><i style="width:' + Math.round(sudah.length / s.anggota.length * 100) + '%"></i></div>' +
        '<div class="grid g2" style="gap:4px 16px">' + baca.map(function (x) { return '<div class="row between small" style="min-height:32px"><span>' + esc(x.a.nama) + '</span>' + (x.t ? '<span class="ind hijau">' + icon('check', 'sm') + tgl(x.t) + '</span>' : '<span class="mute">Belum</span>') + '</div>'; }).join('') + '</div></div>');
    }
    if (rat.status === 'Paket terbit' && kelola) {
      blok.push('<div class="card stack"><h2>Hari RAT</h2><p class="body">Memulai RAT membuka daftar hadir dan menampilkan kode hadir untuk anggota. Di produk sesungguhnya tombol aktif pada tanggal RAT.</p><div><button class="btn primary" data-act="mulai-rat">' + icon('play') + 'Mulai RAT</button></div></div>');
    }
    if (rat.status === 'Berlangsung' || rat.status === 'Selesai') {
      var kuo = TK.kuorumRAT(s);
      var hadirIds = rat.kehadiran.map(function (k) { return k.anggota_id; });
      blok.push('<div class="card stack">' + (rat.status === 'Berlangsung' ? '<div class="row between"><h2>Daftar hadir</h2><div class="stack sm" style="align-items:flex-end"><span class="label">Kode hadir</span><span class="big mono" style="letter-spacing:.15em">' + esc(rat.kode_hadir) + '</span></div></div>' : '<h2>Daftar hadir</h2>') +
        '<p>' + (kuo.tercapai ? '<span class="ind hijau">' + icon('checkCircle', 'sm') + 'Kuorum tercapai</span>' : '<span class="ind kuning">' + icon('alert', 'sm') + 'Kuorum belum tercapai</span>') + ' · hadir ' + kuo.hadir + ' dari ' + kuo.anggota + ', perlu ' + kuo.perlu + '.</p>' +
        '<div class="grid g2" style="gap:4px 16px">' + s.anggota.map(function (a) {
          var h = hadirIds.indexOf(a.id) >= 0;
          return '<div class="row between small" style="min-height:44px"><span>' + esc(a.nama) + '</span>' + (h ? '<span class="ind hijau">' + icon('check', 'sm') + 'Hadir</span>' : (kelola && rat.status === 'Berlangsung' ? '<button class="btn ghost sm" data-act="tandai-hadir" data-id="' + a.id + '">Tandai hadir</button>' : '<span class="mute">Tidak hadir</span>')) + '</div>';
        }).join('') + '</div></div>');
      var rek = TK.rekapSuara(s);
      blok.push('<div class="card"><h2 style="margin-bottom:12px">Hasil suara</h2><div class="table-wrap"><table class="t"><thead><tr><th>Agenda</th><th class="r">Setuju</th><th class="r">Tidak</th><th class="r">Abstain</th><th class="r">Jumlah</th></tr></thead><tbody>' +
        rek.map(function (x) { return '<tr><td>' + esc(x.judul) + '</td><td class="r">' + x.rekap.Setuju + '</td><td class="r">' + x.rekap['Tidak setuju'] + '</td><td class="r">' + x.rekap.Abstain + '</td><td class="r strong">' + x.total + '</td></tr>'; }).join('') +
        '</tbody></table></div><p class="small mute" style="margin-top:8px">Satu anggota satu suara per agenda; suara tidak dapat diubah. Hanya anggota hadir yang dapat memberi suara.</p>' +
        (kelola && rat.status === 'Berlangsung' ? '<div style="margin-top:16px"><button class="btn primary" data-act="tutup-rat">' + icon('lock') + 'Tutup RAT dan buat berita acara</button></div>' : '') + '</div>');
    }
    if (rat.berita_acara) blok.push(App.ui.beritaAcara(rat.berita_acara));
    return App.pageHead('Rapat Anggota Tahunan', 'Paket terbit paling lambat H-7 lalu dikunci dengan hash. e-RAT melengkapi rapat tatap muka dan tidak menggantikannya.') + '<div class="stack lg">' + blok.join('') + '</div>';
  }
  App.views['png/rat'] = { title: 'RAT', render: function () { return viewRAT(true); } };
  App.views['pgw/rat'] = { title: 'RAT', render: function () { return viewRAT(false); } };
  App.acts['lihat-paket'] = function () { App.modal('Paket laporan RAT', App.ui.isiPaket(App.state.rat)); };
  App.acts['terbit-paket'] = function () {
    var s = App.state, pt = App.periodeTerbitTerakhir();
    App.confirm({ judul: 'Terbitkan paket RAT?', tombol: 'Terbitkan dan kunci paket',
      isi: '<p>Paket berisi laporan sampai ' + (pt ? TK.namaPeriode(pt.id) : '—') + ', usulan SHU, dan tiga agenda. Setelah terbit, paket dikunci dengan hash SHA-256 dan tidak dapat diubah. Anggota langsung dapat membacanya.</p><p class="small">Hari ini H-' + TK.tgl.diffDays(s.rat.tanggal, App.today()) + ' dari RAT.</p>' }).then(function (ok) {
      if (!ok) return; var r = TK.terbitkanPaket(s); if (!r.ok) { App.toast(r.pesan, 'bad'); return; }
      App.save(); App.toast('Paket RAT terbit dan terkunci.'); App.render();
    });
  };
  App.acts['mulai-rat'] = function () {
    App.confirm({ judul: 'Mulai RAT sekarang?', tombol: 'Mulai RAT', isi: '<p>Daftar hadir dibuka dan kode hadir ditampilkan. Anggota memasukkan kode itu di ponselnya, atau pengurus menandai hadir dari daftar.</p>' }).then(function (ok) {
      if (!ok) return; var r = TK.mulaiRAT(App.state); if (!r.ok) { App.toast(r.pesan, 'bad'); return; } App.save(); App.render();
    });
  };
  App.acts['tandai-hadir'] = function (el) { var r = TK.catatHadir(App.state, el.getAttribute('data-id'), null); if (!r.ok) { App.toast(r.pesan, 'bad'); return; } App.save(); App._focusNext = false; App.render(); App._focusNext = true; };
  App.acts['tutup-rat'] = function () {
    var k = TK.kuorumRAT(App.state);
    App.confirm({ judul: 'Tutup RAT?', tombol: 'Tutup RAT', isi: '<p>Suara ditutup dan berita acara dibentuk otomatis dari daftar hadir (' + k.hadir + ' anggota) dan hasil suara.' + (k.tercapai ? '' : ' Kuorum tidak tercapai dan akan dicatat di berita acara.') + '</p>' }).then(function (ok) {
      if (!ok) return; TK.tutupRAT(App.state); App.save(); App.toast('RAT selesai. Berita acara terbentuk.'); App.render();
    });
  };

  /* ================= Tindak lanjut (pengurus) ================= */
  App.views['png/tiket'] = {
    title: 'Tindak lanjut',
    render: function (r) {
      if (r.arg) return App.ui.detailTiket(r.arg, 'tiket', 'Tindak lanjut');
      var list = App.tiketKop(App.state.koperasi.id).slice().reverse();
      var buka = list.filter(function (t) { return t.status !== 'Selesai'; }), tutup = list.filter(function (t) { return t.status === 'Selesai'; });
      return App.pageHead('Tindak lanjut', 'Status Perlu tindakan membuat tiket untuk pengurus dengan tenggat 14 hari. Penjelasan tertulis kepada anggota wajib, lalu pengawas memverifikasi. Laporan yang belum terbit menjelang tanggal 10 membuat tiket Pengingat.') +
        '<div class="stack lg"><section class="card"><h2 style="margin-bottom:12px">Terbuka</h2>' + App.ui.daftarTiket(buka, 'tiket', App.empty('flag', 'Tidak ada tiket terbuka', 'Tiket Tindak lanjut muncul di sini bila tutup buku menghasilkan status Perlu tindakan.')) + '</section>' +
        '<section class="card"><h2 style="margin-bottom:12px">Selesai</h2>' + App.ui.daftarTiket(tutup, 'tiket') + '</section></div>';
    }
  };

  /* ================= Pengawas ================= */
  App.views['pgw/tinjau'] = {
    title: 'Tinjau laporan',
    render: function (r) {
      var s = App.state;
      var tunggu = s.periode.filter(function (p) { return p.status === 'Ditutup'; });
      if (!tunggu.length) {
        var pb = TK.periodeBerjalan(s);
        return App.pageHead('Tinjau laporan', 'Pengawas mengesahkan laporan sebelum terbit ke anggota. Pengurus tidak dapat mengesahkan laporannya sendiri.', '<button class="btn outline" data-act="keutuhan">' + icon('link') + 'Periksa keutuhan</button>') +
          '<div class="stack lg"><div id="hasil-keutuhan">' + App.ui.hasilKeutuhan(App._keutuhan) + '</div><div class="card">' + App.empty('fileCheck', 'Tidak ada laporan menunggu pengesahan', 'Laporan berikutnya muncul di sini setelah pengurus menutup buku ' + (pb ? TK.namaPeriode(pb.id) : '') + '.') + '</div>' +
          '<div class="card"><h2 style="margin-bottom:12px">Riwayat periode</h2>' + App.ui.tabelPeriode() + '</div></div>';
      }
      var p = tunggu[0], sk = App.skorDetail(p.id);
      return App.pageHead('Tinjau laporan ' + TK.namaPeriode(p.id), 'Ditutup pengurus ' + App.tglPanjang(p.ditutup_pada) + '. Periksa angka dan keutuhan buku besar sebelum mengesahkan.', '<button class="btn outline" data-act="keutuhan">' + icon('link') + 'Periksa keutuhan</button><button class="btn primary" data-act="sahkan" data-p="' + p.id + '">' + icon('checkCircle') + 'Sahkan laporan ' + TK.namaBulan(p.id) + '</button>') +
        '<div class="stack lg"><div id="hasil-keutuhan">' + App.ui.hasilKeutuhan(App._keutuhan) + '</div>' + App.ui.ringkasSkor(sk, 'Skor ' + TK.namaPeriode(p.id)) +
        App.ui.laporan(p.id) + '<div class="card"><h2 style="margin-bottom:12px">Rincian indikator</h2>' + App.ui.tabelIndikator(sk) + '</div>' +
        '<p class="small mute">Hash ujung buku besar saat tutup buku: <span class="hash">' + App.pendek(sk.rekam.ujung_hash, 16) + '</span></p></div>';
    }
  };
  App.acts.sahkan = function (el) {
    var pid = el.getAttribute('data-p');
    var tglBatas = TK.tgl.awalPeriode(TK.tgl.periodeBerikut(pid)).slice(0, 8) + '10';
    App.confirm({ judul: 'Sahkan laporan ' + TK.namaPeriode(pid) + '?', tombol: 'Sahkan dan terbitkan',
      isi: '<p>Laporan dan skor terbit ke seluruh anggota dan dinas. Pengesahan tercatat atas nama Anda dan tidak dapat dibatalkan.</p>' + (App.today() > tglBatas ? '<p class="small">Hari ini lewat tanggal 10; laporan tercatat terlambat untuk indikator K1.</p>' : '') }).then(function (ok) {
      if (!ok) return; var r = TK.sahkanLaporan(App.state, pid, 'PGW'); if (!r.ok) { App.toast(r.pesan, 'bad'); return; }
      App.save(); App.toast('Laporan ' + TK.namaPeriode(pid) + ' terbit.'); App.render();
    });
  };
  App.views['pgw/verifikasi'] = {
    title: 'Verifikasi tindak lanjut',
    render: function (r) {
      if (r.arg) return App.ui.detailTiket(r.arg, 'verifikasi', 'Verifikasi tindak lanjut');
      var list = App.tiketKop(App.state.koperasi.id).filter(function (t) { return t.jenis === 'Tindak lanjut'; }).slice().reverse();
      var tunggu = list.filter(function (t) { return t.status === 'Menunggu verifikasi'; }), lain = list.filter(function (t) { return t.status !== 'Menunggu verifikasi'; });
      return App.pageHead('Verifikasi tindak lanjut', 'Pastikan penjelasan tertulis sudah dibagikan kepada anggota dan tindakannya benar dilakukan.') +
        '<div class="stack lg"><section class="card"><h2 style="margin-bottom:12px">Menunggu verifikasi</h2>' + App.ui.daftarTiket(tunggu, 'verifikasi', App.empty('checkCircle', 'Tidak ada yang menunggu verifikasi', 'Tiket muncul di sini setelah pengurus mengirim penjelasan tertulis.')) + '</section>' +
        '<section class="card"><h2 style="margin-bottom:12px">Semua tindak lanjut</h2>' + App.ui.daftarTiket(lain, 'verifikasi') + '</section></div>';
    }
  };
})();
