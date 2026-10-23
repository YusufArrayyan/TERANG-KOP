// Pemeriksaan cepat mesin + data simulasi: node tests/engine-check.cjs
const TK = require('../src/js/engine.js');
const SEED = require('../src/js/seed.js');
const t0 = Date.now();
const s = SEED.stateAwal();
console.log('waktu bangun', Date.now() - t0, 'ms; entri', s.entri.length, '; galat seed', s._galatSeed.length);
s._galatSeed.slice(0, 10).forEach(g => console.log('  ', g));
console.log('sha abc ok:', TK.sha256('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
const fmt = sk => sk.indikator.map(i => i.kode + ':' + i.warna[0] + '(' + TK.fmtNilaiInd(i) + ')').join(' ');
s.skor.forEach(r => {
  const sk = TK.hitungSkor(TK.ringkasanPeriode(s, r.periode_id, r.asOf), TK.AMBANG_V1);
  console.log(r.periode_id, r.nilai, r.status.padEnd(15), fmt(sk));
});
const pv = TK.pratinjauSkor(s, '2026-10', s.tanggalSimulasi);
console.log('Okt pratinjau', pv.skor.nilai, pv.skor.status, fmt(pv.skor));
const nr = TK.neraca(s.entri, '2026-10-16', '2026-01-01');
console.log('neraca', JSON.stringify(nr));
console.log('Siti', JSON.stringify(TK.saldoAnggota(s, 'A04')));
const pj7 = TK.statusPinjaman(s, s.pinjaman.find(p => p.id === 'PJ-07'), s.tanggalSimulasi);
console.log('PJ-07', pj7.sisa, pj7.status, pj7.berikut);
console.log('keutuhan', JSON.stringify(TK.periksaKeutuhan(s.entri)));
console.log('hitung ulang semua sama:', TK.hitungUlang(s).every(x => x.sama));
console.log('tiket', s.tiket.length, s.tiket.filter(t => t.koperasi_id === 'KOP-01').map(t => t.id + ' ' + t.jenis + ' ' + t.status + ' ' + t.periode_id).join(' | '));
// Skenario penagihan
const s2 = JSON.parse(JSON.stringify(s));
for (const pid of ['PJ-04', 'PJ-06']) {
  const p = s2.pinjaman.find(x => x.id === pid);
  const st = TK.statusPinjaman(s2, p, s2.tanggalSimulasi);
  const pokok = st.tunggakan.reduce((a, j) => a + j.pokok, 0), jasa = st.tunggakan.reduce((a, j) => a + j.jasa, 0);
  const r = TK.tambahEntri(s2, { tanggal: s2.tanggalSimulasi, jenis: 'T06', anggota_id: p.anggota_id, pinjaman_id: pid, pokok, jasa, cid: 'x' + pid });
  console.log('tagih', pid, pokok, jasa, r.ok);
}
const pv2 = TK.pratinjauSkor(s2, '2026-10', s2.tanggalSimulasi);
console.log('Setelah penagihan', pv2.skor.nilai, pv2.skor.status, fmt(pv2.skor));
// Skenario beban 14 juta
const s3 = JSON.parse(JSON.stringify(s));
const r3 = TK.tambahEntri(s3, { tanggal: s3.tanggalSimulasi, jenis: 'T09', nominal: 14000000, cid: 'b14' });
console.log('beban14', r3.ok, r3.galat);
const pv3 = TK.pratinjauSkor(s3, '2026-10', s3.tanggalSimulasi);
console.log('Beban 14jt', pv3.skor.nilai, pv3.skor.status, fmt(pv3.skor));
const tb = TK.tutupBuku(s3, '2026-10', 'PNG');
console.log('tutup', tb.ok, tb.tiket && tb.tiket.map(t => t.id + ' ' + t.jenis + ' ' + t.tenggat));
const W = SEED.bangunWilayah();
const dist = {}; W.koperasi.forEach(k => { const a = k.bulan[k.bulan.length - 1]; dist[a.status] = (dist[a.status] || 0) + 1; });
console.log('wilayah', JSON.stringify(dist), 'tiket wil', W.tiket.length);
