/* Data halaman depan: salinan seed Kopdes Sukamaju yang dihitung dengan mesin aplikasi (window.TK).
 * Tidak menyentuh App.state, jadi angka di halaman depan selalu sama dengan keadaan awal prototipe. */
const TK = () => window.TK;
const SEED = () => window.SEED;

let cache = null;
const salin = (o) => JSON.parse(JSON.stringify(o));

function tagih(s, pid) {
  const tk = TK();
  const p = s.pinjaman.find((x) => x.id === pid);
  const st = tk.statusPinjaman(s, p, s.tanggalSimulasi);
  const pokok = st.tunggakan.reduce((a, j) => a + j.pokok, 0);
  const jasa = st.tunggakan.reduce((a, j) => a + j.jasa, 0);
  tk.tambahEntri(s, { tanggal: s.tanggalSimulasi, jenis: 'T06', anggota_id: p.anggota_id, pinjaman_id: pid, pokok, jasa, cid: 'lp-' + pid });
}

export function data() {
  if (cache) return cache;
  const tk = TK();
  const s = SEED().stateAwal();
  delete s._galatSeed;

  const tunggak = ['PJ-04', 'PJ-06'].map((pid) => {
    const p = s.pinjaman.find((x) => x.id === pid);
    const st = tk.statusPinjaman(s, p, s.tanggalSimulasi);
    return { id: pid, anggota: s.anggota.find((a) => a.id === p.anggota_id).nama, bulan: st.tunggakan.length, total: st.tunggakan.reduce((a, j) => a + j.total, 0) };
  });

  // Skor Oktober untuk setiap kombinasi angsuran yang dicatat.
  const skor = {};
  [[], ['PJ-04'], ['PJ-06'], ['PJ-04', 'PJ-06']].forEach((set) => {
    const c = salin(s);
    set.forEach((pid) => tagih(c, pid));
    const pv = tk.pratinjauSkor(c, '2026-10', c.tanggalSimulasi);
    skor[set.join('+')] = { sk: pv.skor, n: c.entri.length, ujung: c.entri[c.entri.length - 1].hash };
  });

  // RAT disimulasikan pada salinan: paket, 14 anggota hadir, tiga suara, berita acara.
  const r = salin(s);
  tk.terbitkanPaket(r);
  tk.mulaiRAT(r);
  const pilih = ['Setuju', 'Setuju', 'Setuju', 'Tidak setuju', 'Setuju', 'Abstain', 'Setuju'];
  r.anggota.slice(0, 14).forEach((a) => tk.catatHadir(r, a.id, null));
  r.rat.kehadiran.forEach((k, i) => r.rat.agenda.forEach((ag, j) => tk.kirimSuara(r, ag.id, k.anggota_id, pilih[(i + j) % pilih.length])));
  tk.tutupRAT(r);

  const riwayat = s.skor.slice().sort((a, b) => (a.periode_id < b.periode_id ? -1 : 1)).map((x) => ({ periode: x.periode_id, nilai: x.nilai, status: x.status }));
  const sep = s.skor.find((x) => x.periode_id === '2026-09');
  const tiket = s.tiket.find((t) => t.koperasi_id === s.koperasi.id && t.periode_id === '2026-09');

  cache = { s, tunggak, skor, rat: r, sep, riwayat, tiket };
  return cache;
}

export const rp = (n) => TK().rp(n);
export const tgl = (d) => TK().fmtTgl(d);
export const tglPanjang = (d) => window.App.tglPanjang(d);
export const pendek = (h, n) => window.App.pendek(h, n);
export const bulan = (p) => TK().BULAN[+p.slice(5, 7) - 1];
export const namaPeriode = (p) => TK().namaPeriode(p);
export const fmtNilai = (i) => TK().fmtNilaiInd(i);
export const nominalEntri = (e) => e.baris.reduce((a, b) => a + (b.debit || 0), 0);
