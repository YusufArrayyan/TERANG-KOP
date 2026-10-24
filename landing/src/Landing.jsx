import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { data, rp, tgl, tglPanjang, pendek, namaPeriode, fmtNilai, nominalEntri } from './data.js';
import { Icon, Logo, StatusBadge, IndBadge, Gauge, Chip, Reveal, SectionTitle } from './ui.jsx';
import Score3D from './Score3D.jsx';

const PAD = 'tw:px-[clamp(20px,3.4vw,48px)]';
const WRAP = 'tw:mx-auto tw:w-full tw:max-w-[1360px] ' + PAD;
const GAP = 'tw:mt-[clamp(88px,9vw,140px)]';

function Foto({ src, alt, w, h, className = '', eager }) {
  return <img src={src} alt={alt} width={w} height={h} loading={eager ? 'eager' : 'lazy'} decoding="async" className={'tw:block tw:w-full tw:h-auto tw:object-cover tw:rounded-card ' + className} />;
}

/* ---------------- Hero ---------------- */
function Hero({ d }) {
  const tautan = 'tw:text-sm tw:font-semibold tw:text-on-deep tw:underline tw:underline-offset-4 tw:min-h-11 tw:inline-flex tw:items-center';
  const geser = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  return (
    <header aria-labelledby="lp-h1" className="tw:grid tw:min-h-svh tw:grid-cols-1 tw:lg:grid-cols-2">
      {/* Kiri: isi selebar paling banyak 640 px, rapat ke garis tengah, agar sejajar dengan bagian lain di layar lebar */}
      <div className="on-deep tw:flex tw:bg-deep tw:text-on-deep tw:px-[clamp(20px,3.4vw,48px)] tw:py-8 tw:lg:pr-[clamp(32px,4vw,64px)]">
        <div className="tw:flex tw:w-full tw:max-w-[640px] tw:flex-col tw:gap-10 tw:lg:ml-auto">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
            <a href="#/" className="tw:inline-flex tw:items-center tw:gap-3 tw:text-on-deep tw:no-underline tw:min-h-11" aria-label="TERANG-KOP">
              <Logo className="tw:size-11 tw:rounded-ctl tw:bg-paper tw:p-1.5" /><b translate="no" className="tw:font-extrabold tw:tracking-wide">TERANG-KOP</b>
            </a>
            <span className="tw:flex tw:gap-4 tw:lg:hidden">
              <a href="#lp-panduan" onClick={geser('lp-panduan')} className={tautan}>Cara pakai</a>
              <a href="#/masuk" className={tautan}>Masuk</a>
            </span>
          </div>
          <div className="tw:my-auto tw:pb-4">
            <h1 id="lp-h1" className="tw:text-[clamp(1.875rem,6vw,3rem)] tw:lg:text-[clamp(2.25rem,3.6vw,3.5rem)] tw:leading-[1.02] tw:font-extrabold tw:tracking-[-0.035em] tw:text-on-deep tw:text-balance">
              Angka koperasi desa,<br />terbuka bagi anggota
            </h1>
            <p className="tw:mt-6 tw:text-[17px] tw:leading-relaxed lp-justify tw:text-on-deep-soft">
              TERANG-KOP adalah pembukuan Koperasi Desa Merah Putih. Pengurus mencatat transaksi di ponsel, bahkan tanpa sinyal. Setiap bulan anggota melihat saldonya dan skor kesehatan koperasi. Kalau skor turun, pengurus wajib menjelaskan langkahnya dalam 14 hari.
            </p>
            <div className="tw:mt-7 tw:flex tw:flex-wrap tw:gap-3">
              <a href="#/masuk" className="tw:inline-flex tw:min-h-12 tw:items-center tw:rounded-full tw:bg-amber tw:px-6 tw:font-semibold tw:text-amber-ink tw:no-underline tw:transition tw:hover:brightness-105 tw:active:scale-[.98]">Coba prototipe</a>
              <a href="#lp-coba" onClick={geser('lp-coba')}
                className="tw:inline-flex tw:min-h-12 tw:items-center tw:rounded-full tw:border tw:border-on-deep-soft tw:px-6 tw:font-semibold tw:text-on-deep tw:no-underline tw:transition tw:hover:bg-deep-2">Coba hitung skornya</a>
            </div>
            <dl className="tw:mt-10 tw:grid tw:grid-cols-3 tw:gap-4 tw:rounded-card tw:bg-deep-2 tw:p-5">
              {[[String(d.s.anggota.length), 'anggota koperasi'], [String(d.s.entri.length), 'catatan buku besar'], ['7', 'indikator kesehatan']].map(([v, l]) => (
                <div key={l}><dt className="tw:text-[28px] tw:font-extrabold tw:tracking-tight tw:tabular-nums">{v}</dt><dd className="tw:m-0 tw:text-sm tw:text-on-deep-soft">{l}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      {/* Kanan: baris tautan sejajar dengan logo, grafik dan status di tengah */}
      <div className="on-deep tw:flex tw:bg-deep-2 tw:text-on-deep tw:px-[clamp(20px,3.4vw,48px)] tw:py-8 tw:lg:pl-[clamp(32px,4vw,64px)]">
        <div className="tw:flex tw:w-full tw:max-w-[640px] tw:flex-col tw:gap-6 tw:lg:mr-auto">
          <div className="tw:hidden tw:min-h-11 tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-4 tw:gap-y-1 tw:lg:flex">
            <p className="tw:text-sm tw:font-semibold tw:text-on-deep-soft">Kopdes Merah Putih Sukamaju · data simulasi</p>
            <span className="tw:flex tw:gap-5">
              <a href="#lp-panduan" onClick={geser('lp-panduan')} className={tautan}>Cara pakai</a>
              <a href="#/masuk" className={tautan}>Masuk ke prototipe</a>
            </span>
          </div>
          <div className="tw:my-auto tw:flex tw:flex-col tw:gap-6 tw:pb-4">
            <Score3D riwayat={d.riwayat} />
            <div className="tw:flex tw:items-center tw:gap-4 tw:rounded-card tw:bg-deep tw:p-4">
              <Gauge nilai={d.sep.nilai} status={d.sep.status} size={64} />
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1"><b>September 2026: skor {d.sep.nilai}</b><StatusBadge status={d.sep.status} /></div>
                <span className="tw:mt-1 tw:block tw:text-sm tw:text-on-deep-soft">Likuiditas dan kualitas aset kuning. Tiket Pendampingan terbuka untuk pendamping KJDP.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Pita angka esai ---------------- */
function Angka() {
  const rows = [['80.000+', 'desa membentuk Koperasi Desa/Kelurahan Merah Putih sejak Maret 2025 (Revindo, 2026)'],
    ['1,7 juta', 'anggota tercatat pada Januari 2026, sekitar 21 orang per koperasi (InvestorTrust.id, 2026b)'],
    ['71,5%', 'koperasi aktif yang masih menggelar RAT pada akhir 2023 (Rajagukguk, 2025)'],
    ['Rp26 triliun', 'kerugian dari delapan koperasi bermasalah (Antara, 2025)']];
  return (
    <section aria-labelledby="lp-data-h" className="tw:bg-brand-pale tw:py-12">
      <h2 id="lp-data-h" className="tw:sr-only">Angka Koperasi Desa Merah Putih</h2>
      <dl className={WRAP + ' tw:grid tw:grid-cols-2 tw:gap-x-6 tw:gap-y-12 tw:lg:grid-cols-4'}>
        {rows.map(([v, l], i) => (
          <Reveal key={v} delay={i * 0.06}>
            <dt className="tw:text-[clamp(2.25rem,3.6vw,3.25rem)] tw:font-extrabold tw:leading-none tw:tracking-[-0.035em] tw:text-brand-ink tw:tabular-nums">{v}</dt>
            <dd className="tw:m-0 tw:mt-3 tw:max-w-[30ch] tw:text-[15px] tw:text-ink">{l}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

/* ---------------- Skor yang bisa dioperasikan ---------------- */
function Coba({ d }) {
  const [set, setSet] = useState([]);
  const h = d.skor[set.join('+')], sk = h.sk;
  const toggle = (id) => setSet((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].sort()));
  return (
    <section id="lp-coba" aria-labelledby="lp-coba-h" className={WRAP + ' ' + GAP + ' tw:grid tw:gap-10 tw:lg:grid-cols-12 tw:items-center'}>
      <Reveal className="tw:lg:col-span-5 tw:flex tw:flex-col tw:gap-5">
        <SectionTitle id="lp-coba-h">Tagih dua peminjam, lihat skornya naik</SectionTitle>
        <p className="tw:text-[17px] tw:leading-relaxed lp-justify">Oktober belum ditutup. Dua peminjam Kopdes Sukamaju menunggak lebih dari 30 hari, jadi perlindungan dan kualitas aset merah dan statusnya Perlu tindakan. Centang angsuran mereka: skor dihitung ulang dari buku besar dengan mesin yang sama dengan aplikasi.</p>
        <ul className="tw:m-0 tw:grid tw:gap-2 tw:p-0 tw:list-none">
          {[['calc', 'Skor 0 sampai 100 dari tujuh indikator berbobot'], ['alert', 'Dua indikator merah langsung berarti Perlu tindakan'], ['shield', 'Skor adalah peringatan dini, bukan penilaian hukum']].map(([ic, t]) => (
            <li key={t} className="tw:flex tw:items-center tw:gap-3 tw:rounded-ctl tw:bg-surface tw:px-4 tw:py-3 tw:text-[15px] tw:font-medium"><Icon name={ic} className="tw:text-brand-ink" />{t}</li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.08} className="tw:lg:col-span-7">
        <div id="lp-skor" data-ui className="tw:rounded-card tw:bg-surface tw:p-5 tw:sm:p-6 tw:text-[15px]">
          <div className="tw:mb-4 tw:flex tw:items-start tw:justify-between tw:gap-3">
            <div><b className="tw:block">Kopdes Merah Putih Sukamaju</b><span className="tw:text-[13px] tw:text-mute">Pratinjau skor Oktober 2026, per {tgl(d.s.tanggalSimulasi)}</span></div>
            <Chip tone="amber" icon="clock">Belum terkunci</Chip>
          </div>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-4 tw:rounded-card tw:bg-surface-2 tw:p-4">
            <Gauge nilai={sk.nilai} status={sk.status} />
            <div className="tw:flex-1 tw:min-w-[200px] tw:flex tw:flex-col tw:gap-2">
              <span data-skor={sk.nilai}><StatusBadge status={sk.status} lg /></span>
              <p className="tw:text-sm tw:text-body">{sk.penurun.length ? 'Paling menurunkan skor: ' + sk.penurun.slice(0, 2).map((i) => i.nama.toLowerCase()).join(' dan ') + '.' : 'Semua indikator hijau.'}{sk.jumlahMerah >= 2 ? ' Dua indikator merah, status Perlu tindakan.' : ''}</p>
            </div>
          </div>
          <ul className="tw:m-0 tw:mt-3 tw:list-none tw:p-0" aria-label="Tujuh indikator">
            {sk.indikator.map((i) => (
              <li key={i.kode} className="tw:grid tw:grid-cols-[28px_1fr_auto_84px] tw:items-center tw:gap-3 tw:border-b tw:border-line tw:py-2 tw:last:border-0">
                <span aria-hidden="true" className="tw:grid tw:size-7 tw:place-items-center tw:rounded-ctl tw:bg-surface-2 tw:text-[13px] tw:font-extrabold">{i.kode}</span>
                <span className="tw:text-sm">{i.nama}</span>
                <span className="tw:text-sm tw:font-semibold tw:tabular-nums">{fmtNilai(i)}</span>
                <IndBadge warna={i.warna} />
              </li>
            ))}
          </ul>
          <fieldset className="tw:m-0 tw:mt-4 tw:grid tw:gap-2 tw:border-0 tw:border-t tw:border-line tw:p-0 tw:pt-4">
            <legend className="tw:float-left tw:mb-2 tw:w-full tw:text-sm tw:font-bold">Coba tagih peminjam yang menunggak</legend>
            {d.tunggak.map((t) => {
              const on = set.includes(t.id);
              return (
                <label key={t.id} className={'tw:flex tw:min-h-13 tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-ctl tw:border tw:px-3 tw:py-2 tw:transition ' + (on ? 'tw:border-brand tw:bg-brand-pale' : 'tw:border-line-strong tw:hover:bg-surface-2')}>
                  <input type="checkbox" data-lp-tagih={t.id} checked={on} onChange={() => toggle(t.id)} className="tw:size-5 tw:accent-brand" />
                  <span><b className="tw:block tw:text-sm">Catat angsuran {t.id}</b><span className="tw:block tw:text-[13px] tw:text-body">{t.anggota} · {t.bulan} angsuran tertunggak · {rp(t.total)}</span></span>
                </label>
              );
            })}
          </fieldset>
          <p className="tw:mt-3 tw:text-[13px] tw:text-mute" aria-live="polite">Dihitung ulang dari {h.n} catatan buku besar · sidik jari terakhir {pendek(h.ujung, 8)}</p>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- Masalah ---------------- */
function Masalah() {
  return (
    <section aria-labelledby="lp-intro-h" className={WRAP + ' ' + GAP + ' tw:grid tw:gap-10 tw:md:grid-cols-12 tw:items-center'}>
      <Reveal className="tw:md:col-span-6 tw:flex tw:flex-col tw:gap-4">
        <SectionTitle id="lp-intro-h">Sekitar 21 anggota per koperasi</SectionTitle>
        <p className="tw:text-[17px] tw:font-semibold tw:leading-relaxed lp-justify">Lebih dari 80.000 desa membentuk Koperasi Desa/​Kelurahan Merah Putih sejak Inpres Nomor 9 Tahun 2025, dengan anggota melampaui 1,7 juta orang pada Januari 2026. Dibagi rata, satu koperasi hanya beranggotakan sekitar 21 orang.</p>
        <p className="tw:leading-relaxed lp-justify">Kepemilikan setipis itu membuat pengawasan oleh anggota sulit berjalan dengan sendirinya. Jumlah koperasi aktif turun dari 209.448 unit pada 2014 menjadi 130.119 pada akhir 2023. Ketika rapat anggota tidak lagi digelar, tidak ada yang memeriksa angkanya.</p>
        <p className="tw:leading-relaxed lp-justify">Penjaminan simpanan baru bekerja setelah koperasi gagal. TERANG-KOP dirancang untuk bekerja sebelum itu: anggota melihat angka koperasinya tiap bulan, dan skor yang turun langsung membuka tugas bertenggat bagi pengurus atau pendamping.</p>
        <p className="tw:text-sm tw:text-body">Sumber: Revindo (2026); InvestorTrust.id (2026b); Rajagukguk (2025); Antara (2025). Rincian di esai COOPFEST 2026.</p>
      </Reveal>
      <Reveal delay={0.08} as="figure" className="tw:m-0 tw:md:col-span-6 tw:md:col-start-7">
        <Foto src="img/tugu.jpg" alt="Tugu peringatan Kongres Koperasi di Tasikmalaya, lambang koperasi di atas alas hitam di antara pilar putih" w={1100} h={619} className="tw:aspect-[4/3]" />
        <figcaption className="tw:mt-3 tw:text-[15px] tw:text-body">Tugu Kongres Koperasi pertama di Tasikmalaya. Gerakan koperasi Indonesia berumur hampir delapan puluh tahun.</figcaption>
      </Reveal>
    </section>
  );
}

/* ---------------- Pelengkap sistem pemerintah ---------------- */
function Pelengkap({ d }) {
  const s = d.s;
  // Cuplikan berkas ekspor "Skor bulanan" yang sama dengan layar Ekspor dinas, dari buku besar simulasi.
  const baris = s.skor.slice().sort((a, b) => (a.periode_id < b.periode_id ? -1 : 1)).slice(-4).map((r) => {
    const p = s.periode.find((x) => x.id === r.periode_id);
    return [s.koperasi.id, r.periode_id, r.nilai, r.status, r.ambang_versi, p.terbit_pada].join(',');
  });
  const csv = ['koperasi_id,periode,skor,status,ambang,terbit_pada'].concat(baris).join('\n');
  const banding = [
    ['Untuk siapa', 'Pelaporan koperasi kepada pemerintah: pembinaan, pengawasan, dan evaluasi.', 'Anggota koperasi: saldo, pinjaman, laporan bulanan, dan skor koperasinya sendiri.'],
    ['Peringatan dini', 'Dokumen kebijakan yang terbuka untuk publik belum merinci cara kerjanya.', 'Skor tujuh indikator tiap tutup buku; Waspada dan Perlu tindakan langsung membuka tiket bertenggat.'],
    ['Tindak lanjut', 'Tidak disebut dalam dokumen yang dikutip esai.', 'Pendamping KJDP dalam 7 hari kerja; penjelasan tertulis pengurus kepada anggota dalam 14 hari.'],
    ['Rapat anggota', 'Tidak disebut dalam dokumen yang dikutip esai.', 'Paket RAT terbit paling lambat H-7 dan dikunci; hadir, suara, dan berita acara tercatat.'],
    ['Data ke pemerintah', 'Sumber resmi pelaporan Kopdes Merah Putih.', 'Ekspor CSV dan JSON dari buku besar yang sama; integrasi langsung menunggu persetujuan Kemenkop.']
  ];
  return (
    <section aria-labelledby="lp-pelengkap-h" className={WRAP + ' ' + GAP}>
      <Reveal className="tw:grid tw:gap-6 tw:lg:grid-cols-12 tw:lg:items-end">
        <div className="tw:lg:col-span-7 tw:flex tw:flex-col tw:gap-4">
          <SectionTitle id="lp-pelengkap-h">Bukan pengganti Simkopdes</SectionTitle>
          <p className="tw:max-w-[62ch] tw:text-[17px] tw:leading-relaxed lp-justify">Pemerintah sudah menyiapkan sistem informasi manajemen dan pelaporan Kopdes Merah Putih lewat Peraturan Menteri Koperasi Nomor 2 Tahun 2025. TERANG-KOP tidak menyaingi sistem itu. Ia mengisi bagian yang belum dijamin: anggota bisa melihat angka koperasinya setiap bulan, dan setiap kemunduran punya tenggat tindak lanjut.</p>
        </div>
        <p className="tw:lg:col-span-5 tw:text-sm tw:text-body">Kolom sistem pemerintah diringkas dari dokumen yang dikutip esai (Menteri Koperasi, 2025; Katadata, 2026), bukan dari uji langsung terhadap aplikasinya.</p>
      </Reveal>

      <Reveal delay={0.06} className="tw:mt-8 tw:hidden tw:overflow-x-auto tw:rounded-card tw:bg-surface tw:md:block">
        <table className="tw:w-full tw:min-w-[640px] tw:border-collapse tw:text-[15px]">
          <caption className="tw:sr-only">Perbandingan sistem pelaporan pemerintah dan TERANG-KOP</caption>
          <thead>
            <tr className="tw:text-left">
              <th scope="col" className="tw:w-[18%] tw:px-5 tw:pt-5 tw:pb-3 tw:text-[13px] tw:font-semibold tw:text-mute"><span className="tw:sr-only">Aspek</span></th>
              <th scope="col" className="tw:w-[38%] tw:px-5 tw:pt-5 tw:pb-3"><span className="tw:block tw:text-base tw:font-bold">Sistem pemerintah</span><span className="tw:text-[13px] tw:font-medium tw:text-mute">Simkopdes, Permenkop 2/2025</span></th>
              <th scope="col" className="tw:w-[44%] tw:rounded-tr-card tw:bg-brand-pale tw:px-5 tw:pt-5 tw:pb-3"><span className="tw:flex tw:items-center tw:gap-2 tw:text-base tw:font-bold tw:text-brand-ink"><Logo className="tw:size-5" />TERANG-KOP</span><span className="tw:text-[13px] tw:font-medium tw:text-brand-ink">dijalankan KJDP kabupaten</span></th>
            </tr>
          </thead>
          <tbody>
            {banding.map(([a, g, t], i) => (
              <tr key={a} className="tw:align-top">
                <th scope="row" className="tw:border-t tw:border-line tw:px-5 tw:py-4 tw:text-left tw:font-semibold">{a}</th>
                <td className="tw:border-t tw:border-line tw:px-5 tw:py-4 tw:text-body">{g}</td>
                <td className={'tw:border-t tw:border-line tw:bg-brand-pale tw:px-5 tw:py-4 ' + (i === banding.length - 1 ? 'tw:rounded-br-card' : '')}>
                  <span className="tw:flex tw:gap-2"><Icon name="check" className="tw:mt-0.5 tw:text-brand-ink" /><span>{t}</span></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
      <ul className="tw:mt-8 tw:grid tw:list-none tw:grid-cols-1 tw:gap-3 tw:p-0 tw:md:hidden" aria-label="Perbandingan sistem pemerintah dan TERANG-KOP">
        {banding.map(([a, g, t]) => (
          <li key={a} className="tw:overflow-hidden tw:rounded-card tw:bg-surface">
            <b className="tw:block tw:px-4 tw:pt-4 tw:pb-2">{a}</b>
            <p className="tw:px-4 tw:pb-3 tw:text-[15px] tw:text-body"><span className="tw:block tw:text-[13px] tw:font-semibold tw:text-mute">Sistem pemerintah</span>{g}</p>
            <p className="tw:bg-brand-pale tw:px-4 tw:py-3 tw:text-[15px]"><span className="tw:block tw:text-[13px] tw:font-semibold tw:text-brand-ink">TERANG-KOP</span>{t}</p>
          </li>
        ))}
      </ul>

      <div className="tw:mt-8 tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-12 tw:lg:items-start">
        <Reveal delay={0.08} className="tw:min-w-0 tw:lg:col-span-5 tw:flex tw:flex-col tw:gap-3">
          <b className="tw:text-lg">Cara keduanya tersambung</b>
          <ol className="tw:m-0 tw:flex tw:flex-col tw:gap-5 tw:rounded-card tw:bg-surface tw:p-5 tw:pl-10 tw:marker:font-extrabold tw:marker:text-brand-ink">
            {[['Dicatat di buku besar TERANG-KOP', 'Pengurus mencatat sekali; skor dan laporan dihitung dari catatan yang sama.'],
              ['Diekspor sebagai CSV dan JSON', 'Dinas mengunduh ringkasan wilayah, skor bulanan, tiket, dan buku besar dari layar Ekspor.'],
              ['Dipakai dinas dan Simkopdes', 'Berkas menjadi bahan pelaporan resmi. Integrasi otomatis baru dibangun setelah ada persetujuan Kemenkop.']].map(([j, t]) => (
              <li key={j} className="tw:pl-1"><b className="tw:block tw:text-lg">{j}</b><span className="tw:text-[15px] tw:text-body">{t}</span></li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={0.12} className="on-deep tw:min-w-0 tw:lg:col-span-7 tw:flex tw:flex-col tw:gap-3 tw:rounded-card tw:bg-deep tw:p-5 tw:text-on-deep">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
            <b>terangkop-skor-2026-10-16.csv</b>
            <span className="tw:text-sm tw:text-on-deep-soft">cuplikan 4 baris terakhir · data simulasi</span>
          </div>
          <pre className="tw:m-0 tw:max-w-full tw:overflow-x-auto tw:rounded-ctl tw:bg-deep-2 tw:p-4 tw:font-mono tw:text-[13px] tw:leading-relaxed tw:text-on-deep"><code>{csv}</code></pre>
          <p className="tw:text-sm tw:text-on-deep-soft">Setiap baris menyimpan versi ambang yang dipakai, jadi dinas bisa menghitung ulang skor dari data yang sama dan mendapat hasil yang sama.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Cara kerja ---------------- */
const LANGKAH = [
  ['Catat sekali, bahkan tanpa sinyal.', 'Pengurus mencatat simpanan, angsuran, dan penjualan gerai di ponsel. Entri luring menunggu di antrean dan masuk buku besar saat sinyal kembali.',
    [['wifiOff', 'Tetap mencatat tanpa sinyal'], ['hash', 'Nomor unik per catatan, tidak tercatat dua kali'], ['check', 'Jurnal ganda dibentuk otomatis']]],
  ['Lalu buku besar menghitung skornya.', 'Saat tutup buku bulanan, sistem menghitung tujuh indikator kesehatan (adaptasi PEARLS) dari catatan yang sama. Setiap catatan dikunci dengan sidik jari digital, jadi perubahan diam-diam ketahuan.',
    [['chart', 'Tujuh indikator, bobot total 100'], ['link', 'Rantai sidik jari SHA-256'], ['refresh', 'Dinas menghitung ulang, hasilnya sama']]],
  ['Bila skor turun, tiket bertenggat terbuka.', 'Status Waspada mewajibkan pendamping KJDP menghubungi pengurus dalam tujuh hari kerja. Status Perlu tindakan memberi pengurus 14 hari untuk menjelaskan langkah perbaikannya kepada anggota secara tertulis.',
    [['clock', 'Waspada: kontak pertama dalam 7 hari kerja'], ['flag', 'Perlu tindakan: 14 hari, penjelasan tertulis'], ['alert', 'Lewat tenggat: tanda Terlambat di dasbor dinas']]]
];

function Row({ children, className = '' }) {
  return <div className={'tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:border-b tw:border-line tw:py-2.5 tw:last:border-0 ' + className}>{children}</div>;
}

function Panggung({ d, aktif }) {
  const s = d.s, tk = d.tiket;
  const isi = [
    <div key="0">
      <div className="tw:mb-3 tw:flex tw:items-start tw:justify-between tw:gap-3"><div><b className="tw:block">Antrean luring</b><span className="tw:text-[13px] tw:text-mute">Ponsel bendahara, tanpa sinyal</span></div><Chip tone="amber" icon="wifiOff">Luring · 2</Chip></div>
      {[['Angsuran PJ-04 ke-4 sampai ke-6', 'Joko Susilo · T06', 981000], ['Setoran simpanan wajib Oktober', 'Siti Aminah · T02', 25000]].map(([u, m, n]) => (
        <Row key={u}><div className="tw:flex-1 tw:min-w-[11rem]"><b className="tw:block tw:text-sm">{u}</b><span className="tw:text-[13px] tw:text-mute">{m} · {tgl(s.tanggalSimulasi)}</span></div><b className="tw:tabular-nums">{rp(n)}</b><Chip tone="amber" icon="clock">Menunggu sinkron</Chip></Row>
      ))}
      <p className="tw:mt-3 tw:text-sm tw:text-body">Setiap catatan punya nomor unik, jadi kiriman ulang tidak tercatat dua kali.</p>
    </div>,
    <div key="1">
      <div className="tw:mb-3 tw:flex tw:items-start tw:justify-between tw:gap-3"><div><b className="tw:block">Buku besar</b><span className="tw:text-[13px] tw:text-mute">{s.entri.length} catatan, tidak bisa diubah atau dihapus</span></div><Chip icon="link">Rantai utuh</Chip></div>
      {s.entri.slice(-4).reverse().map((e) => (
        <Row key={e.id}><span className="tw:text-[13px] tw:font-bold tw:text-body tw:tabular-nums">{e.id}</span><div className="tw:flex-1 tw:min-w-[9rem]"><b className="tw:block tw:text-sm">{e.uraian}</b><span className="tw:text-[13px] tw:text-mute tw:tabular-nums">{pendek(e.hash, 10)}</span></div><b className="tw:tabular-nums">{rp(nominalEntri(e))}</b></Row>
      ))}
      <div className="tw:mt-3 tw:flex tw:items-center tw:gap-4 tw:rounded-card tw:bg-surface-2 tw:p-3"><Gauge nilai={d.sep.nilai} status={d.sep.status} size={64} /><div className="tw:flex tw:flex-col tw:gap-2"><b>Tutup buku September</b><StatusBadge status={d.sep.status} /></div></div>
    </div>,
    <div key="2">
      <div className="tw:mb-3 tw:flex tw:items-start tw:justify-between tw:gap-3"><div><b className="tw:block">{tk.id} · {tk.jenis}</b><span className="tw:text-[13px] tw:text-mute">Untuk {tk.pemilik_nama}, salinan {tk.salinan.join(', ')}</span></div><Chip tone="amber">{tk.status}</Chip></div>
      <p className="tw:text-sm tw:text-body">{tk.ringkasan}</p>
      <dl className="tw:my-3 tw:grid tw:grid-cols-[max-content_1fr] tw:gap-x-5 tw:gap-y-1 tw:text-sm"><dt className="tw:text-mute">Dibuat</dt><dd className="tw:m-0 tw:font-medium">{tglPanjang(tk.dibuat)}</dd><dt className="tw:text-mute">Tenggat kontak</dt><dd className="tw:m-0 tw:font-medium">{tglPanjang(tk.tenggat)}</dd></dl>
      <div className="tw:flex tw:items-start tw:gap-3"><span className="tw:grid tw:size-9 tw:shrink-0 tw:place-items-center tw:rounded-full tw:bg-ink tw:text-[13px] tw:font-bold tw:text-surface">DP</span><div><b className="tw:block tw:text-sm">Dimas Pratama (KJDP)</b><span className="tw:text-[13px] tw:text-body">{tk.catatan[0].teks}</span></div></div>
    </div>
  ];
  const cap = [
    [['2', 'entri menunggu sinkron'], [rp(1006000), 'nilai di antrean'], ['0', 'entri tergandakan']],
    [[String(s.entri.length), 'catatan di buku besar'], [String(d.sep.nilai), 'skor September'], ['Utuh', 'rantai sidik jari']],
    [[tk.id, tk.jenis], [tgl(tk.tenggat), 'tenggat kontak pertama'], [tk.status, 'status tiket']]
  ];
  return { isi, cap };
}

function CaraKerja({ d }) {
  const [aktif, setAktif] = useState(0);
  const refs = useRef([]);
  const { isi, cap } = useMemo(() => Panggung({ d }), [d]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setAktif(+e.target.dataset.step); }), { rootMargin: '-45% 0px -45% 0px' });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const ke = (i) => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return (
    <section id="lp-alur" aria-labelledby="lp-alur-h" className={WRAP + ' ' + GAP + ' tw:grid tw:gap-10 tw:lg:grid-cols-12 tw:items-start'}>
      <div className="tw:lg:col-span-5">
        <SectionTitle id="lp-alur-h" className="tw:mb-4">Dari catatan ke peringatan</SectionTitle>
        {LANGKAH.map(([t, s, fakta], i) => (
          <div key={t} ref={(el) => (refs.current[i] = el)} data-step={i} className="tw:flex tw:flex-col tw:justify-center tw:gap-4 tw:py-6 tw:lg:min-h-[52vh]">
            <p className={'tw:text-[clamp(1.5rem,2.4vw,2.125rem)] tw:leading-[1.15] tw:font-extrabold tw:tracking-[-0.02em] tw:transition-colors tw:max-w-[20ch] ' + (aktif === i ? 'tw:text-ink' : 'tw:text-ink tw:lg:text-mute')}>{t}</p>
            <p className="tw:max-w-[60ch] tw:leading-relaxed lp-justify">{s}</p>
            <ul className="tw:m-0 tw:grid tw:max-w-[46ch] tw:list-none tw:gap-2 tw:p-0">
              {fakta.map(([ic, f]) => <li key={f} className="tw:flex tw:items-center tw:gap-3 tw:rounded-ctl tw:bg-surface tw:px-4 tw:py-3 tw:text-[15px] tw:font-medium"><Icon name={ic} className="tw:text-brand-ink" />{f}</li>)}
            </ul>
            <div className="tw:lg:hidden tw:rounded-card tw:bg-surface tw:p-4 tw:text-[15px]" data-ui>{isi[i]}</div>
          </div>
        ))}
      </div>
      <div className="on-deep tw:hidden tw:lg:flex tw:lg:col-span-7 tw:sticky tw:top-[10vh] tw:mt-20 tw:min-h-[min(80vh,760px)] tw:flex-col tw:items-stretch tw:justify-center tw:gap-6 tw:rounded-card tw:bg-deep tw:p-6 tw:text-on-deep">
        <div className="tw:flex tw:gap-1 tw:rounded-full tw:bg-deep-2 tw:p-1" role="group" aria-label="Tahap">
          {['Catat', 'Hitung skor', 'Tindak lanjut'].map((t, i) => (
            <button key={t} type="button" onClick={() => ke(i)} aria-pressed={aktif === i}
              className={'tw:min-h-11 tw:flex-1 tw:cursor-pointer tw:rounded-full tw:border-0 tw:text-[15px] tw:font-semibold tw:transition ' + (aktif === i ? 'tw:bg-paper tw:text-paper-ink' : 'tw:bg-transparent tw:text-on-deep-soft tw:hover:text-on-deep')}>{t}</button>
          ))}
        </div>
        <div className="tw:mx-auto tw:w-full tw:max-w-[600px] tw:rounded-card tw:bg-surface tw:p-6 tw:text-[15px] tw:text-ink" data-ui>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={aktif} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>{isi[aktif]}</motion.div>
          </AnimatePresence>
        </div>
        <dl className="tw:m-0 tw:grid tw:grid-cols-3 tw:gap-4">
          {cap[aktif].map(([v, l]) => <div key={l}><dt className="tw:text-[28px] tw:font-extrabold tw:leading-tight tw:tracking-tight tw:text-amber tw:tabular-nums">{v}</dt><dd className="tw:m-0 tw:mt-1 tw:text-[15px] tw:text-on-deep-soft">{l}</dd></div>)}
        </dl>
      </div>
    </section>
  );
}

/* ---------------- Lembar keluaran ---------------- */
const KELUAR = [['ringkasan', 'Ringkasan anggota'], ['laporan', 'Laporan bulanan'], ['paket', 'Paket RAT'], ['ba', 'Berita acara']];

function Lembar({ d, jenis }) {
  const TK = window.TK, s = d.s;
  const Kepala = ({ judul, sub }) => (
    <div className="tw:flex tw:items-center tw:gap-3 tw:border-b-2 tw:border-[var(--paper-brand)] tw:pb-3">
      <Logo className="tw:h-9 tw:w-8 tw:shrink-0" /><div><b className="tw:block tw:text-base">{judul}</b><span className="tw:text-[13px] tw:text-paper-mute">{sub}</span></div>
    </div>
  );
  const Tabel = ({ rows }) => (
    <table className="tw:w-full tw:border-collapse"><tbody>
      {rows.map(([l, v, tot]) => <tr key={l} className={tot ? 'tw:font-bold' : ''}><td className="tw:border-b tw:border-paper-line tw:py-1.5">{l}</td><td className="tw:border-b tw:border-paper-line tw:py-1.5 tw:pl-3 tw:text-right tw:whitespace-nowrap tw:tabular-nums">{v}</td></tr>)}
    </tbody></table>
  );
  const Kaki = ({ children }) => <p className="tw:mt-2 tw:text-[13px] tw:text-paper-mute">{children}</p>;
  if (jenis === 'ringkasan') {
    const sal = TK.saldoAnggota(s, 'A04');
    const pj = TK.statusPinjaman(s, s.pinjaman.find((p) => p.id === 'PJ-07'), s.tanggalSimulasi);
    return <>
      <Kepala judul="Ringkasan anggota · Kopdes Merah Putih Sukamaju" sub={'Siti Aminah · SKM-004 · per ' + tgl(s.tanggalSimulasi)} />
      <Tabel rows={[['Simpanan pokok', rp(sal.pokok)], ['Simpanan wajib', rp(sal.wajib)], ['Simpanan sukarela', rp(sal.sukarela)], ['Jumlah simpanan', rp(sal.total), 1], ['Sisa pinjaman PJ-07 (' + pj.status + ')', rp(pj.sisa)], ['Angsuran berikutnya, ' + tgl(pj.berikut.jatuh_tempo), rp(pj.berikut.total)]]} />
      <p><b>Kesehatan koperasi September 2026:</b> skor {d.sep.nilai}, {d.sep.status}. Skor adalah peringatan dini, bukan penilaian hukum.</p>
      <Kaki>Lembar A5 untuk pertemuan bulanan, bagi anggota yang tidak membuka aplikasi.</Kaki>
    </>;
  }
  if (jenis === 'laporan') {
    const nr = TK.neraca(s.entri, '2026-09-30', '2026-01-01'), lr = TK.labaRugi(s.entri, '2026-09-01', '2026-09-30');
    return <>
      <Kepala judul="Laporan bulanan September 2026" sub={'Disahkan pengawas ' + tgl(TK.cariPeriode(s, '2026-09').disahkan_pada) + ' · terbit sebelum tanggal 10'} />
      <Tabel rows={[['Kas dan bank', rp(nr.kas + nr.bank)], ['Piutang pinjaman anggota', rp(nr.piutang)], ['Penyisihan pinjaman bermasalah', rp(nr.penyisihan)], ['Jumlah aset', rp(nr.aset), 1], ['Simpanan sukarela', rp(nr.sukarela)], ['Utang bank', rp(nr.utangBank)], ['Modal anggota dan SHU', rp(nr.ekuitas)], ['Kewajiban dan ekuitas', rp(nr.kewajiban + nr.ekuitas), 1]]} />
      <Tabel rows={[['Pendapatan September', rp(lr.pendapatan)], ['Beban September', rp(lr.beban)], ['SHU September', rp(lr.shu), 1]]} />
      <Kaki>Neraca seimbang karena setiap entri berjurnal ganda: debit sama dengan kredit.</Kaki>
    </>;
  }
  if (jenis === 'paket') {
    const p = d.rat.rat.paket, shu = p.isi.laba_rugi.shu;
    return <>
      <Kepala judul="Paket RAT 2026 · terkunci" sub={'Terbit ' + tgl(p.terbit_pada) + ', H-' + p.h_minus + ' dari RAT ' + tgl(d.rat.rat.tanggal)} />
      <Tabel rows={[['SHU tahun berjalan sampai September', rp(shu), 1], ['Usulan bagian anggota (70%)', rp(Math.round(shu * 0.7))], ['Usulan cadangan (30%)', rp(shu - Math.round(shu * 0.7))]]} />
      <ol className="tw:m-0 tw:grid tw:gap-1.5 tw:pl-5">{p.isi.agenda.map((a) => <li key={a}>{a}</li>)}</ol>
      <Kaki>Setelah terbit, isi paket dikunci dan tidak dapat diubah. Sidik jari paket {pendek(p.hash, 14)}.</Kaki>
    </>;
  }
  const ba = d.rat.rat.berita_acara;
  return <>
    <Kepala judul="Berita acara RAT 2026" sub="Terbentuk otomatis dari daftar hadir dan hasil suara" />
    <p>Hadir {ba.kuorum.hadir} dari {ba.kuorum.anggota} anggota; kuorum {ba.kuorum.tercapai ? 'tercapai' : 'tidak tercapai'} (perlu {ba.kuorum.perlu}).</p>
    <table className="tw:w-full tw:border-collapse"><thead><tr className="tw:text-left tw:text-[13px] tw:text-paper-mute"><th className="tw:py-1.5 tw:font-semibold">Agenda</th><th className="tw:text-right tw:font-semibold">Setuju</th><th className="tw:text-right tw:font-semibold">Tidak</th><th className="tw:text-right tw:font-semibold">Abstain</th></tr></thead>
      <tbody>{ba.rekap.map((x) => <tr key={x.id}><td className="tw:border-b tw:border-paper-line tw:py-1.5 tw:pr-2">{x.judul} · <b>{x.hasil}</b></td>{[x.rekap.Setuju, x.rekap['Tidak setuju'], x.rekap.Abstain].map((v, k) => <td key={k} className="tw:border-b tw:border-paper-line tw:pl-3 tw:text-right tw:tabular-nums">{v}</td>)}</tr>)}</tbody></table>
    <Kaki>Satu anggota satu suara; suara tidak dapat diubah setelah dikirim. Sidik jari berita acara {pendek(ba.hash, 12)}.</Kaki>
  </>;
}

function Keluaran({ d }) {
  const [k, setK] = useState('ringkasan');
  return (
    <section aria-labelledby="lp-show-h" className={WRAP + ' ' + GAP + ' tw:grid tw:gap-10 tw:lg:grid-cols-12 tw:items-center'}>
      <Reveal className="tw:lg:col-span-5 tw:flex tw:flex-col tw:gap-6">
        <SectionTitle id="lp-show-h">Yang dipegang anggota</SectionTitle>
        <div role="tablist" aria-label="Keluaran sistem" className="tw:flex tw:flex-wrap tw:gap-x-5 tw:gap-y-1 tw:lg:flex-col tw:lg:items-start">
          {KELUAR.map(([id, l]) => (
            <button key={id} type="button" role="tab" id={'lp-tab-' + id} aria-selected={k === id} aria-controls="lp-sheet" data-act="lp-lembar" data-k={id} onClick={() => setK(id)}
              className={'tw:min-h-11 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:text-left tw:text-[clamp(1.5rem,3.4vw,3.25rem)] tw:leading-[1.1] tw:font-extrabold tw:tracking-[-0.025em] tw:transition ' + (k === id ? 'tw:text-ink' : 'tw:text-mute tw:hover:text-body')}>{l}</button>
          ))}
        </div>
        <p className="tw:max-w-[60ch] tw:leading-relaxed lp-justify">Setiap lembar dibentuk dari buku besar yang sama, jadi angka di beranda anggota, di paket RAT, dan di dasbor dinas tidak bisa berbeda.</p>
      </Reveal>
      <Reveal delay={0.08} className="tw:lg:col-span-7 tw:rounded-card tw:bg-surface-2 tw:p-4 tw:sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article key={k} id="lp-sheet" role="tabpanel" aria-labelledby={'lp-tab-' + k} data-ui initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
            className="tw:mx-auto tw:flex tw:max-w-[560px] tw:flex-col tw:gap-4 tw:rounded-ctl tw:bg-paper tw:p-6 tw:text-sm tw:text-paper-ink tw:sm:p-8">
            <Lembar d={d} jenis={k} />
          </motion.article>
        </AnimatePresence>
      </Reveal>
    </section>
  );
}

/* ---------------- Kalkulator pemuda KJDP ---------------- */
function Kjdp() {
  const [n, setN] = useState(30);
  const pemuda = Math.ceil(n / 2);
  const kelompok = Array.from({ length: pemuda }, (_, i) => Math.min(2, n - i * 2));
  return (
    <section aria-labelledby="lp-hitung-h" className={GAP + ' on-deep tw:bg-deep tw:py-20 tw:text-on-deep'}>
      <div className={WRAP + ' tw:grid tw:gap-12 tw:lg:grid-cols-12'}>
        <Reveal className="tw:lg:col-span-5 tw:flex tw:flex-col tw:gap-6">
          <SectionTitle id="lp-hitung-h" className="tw:text-on-deep">Berapa Kopdes di kabupaten Anda?</SectionTitle>
          <div data-ui className="tw:rounded-card tw:bg-surface tw:p-4 tw:text-ink">
            <label htmlFor="lp-n" className="tw:mb-1 tw:block tw:text-sm tw:font-semibold">Koperasi Desa Merah Putih</label>
            <div className="tw:flex tw:items-center tw:gap-4">
              <input id="lp-n" type="range" min="4" max="120" step="1" value={n} onChange={(e) => setN(+e.target.value)} className="tw:min-h-11 tw:flex-1 tw:accent-brand" />
              <output htmlFor="lp-n" className="tw:min-w-[3ch] tw:text-right tw:text-xl tw:font-extrabold tw:tabular-nums">{n}</output>
            </div>
          </div>
          <p className="tw:flex tw:items-end tw:gap-3" aria-live="polite">
            <span className="tw:text-[clamp(5rem,11vw,9rem)] tw:leading-[.82] tw:font-extrabold tw:tracking-[-0.045em] tw:text-amber tw:tabular-nums">{pemuda}</span>
            <span className="tw:pb-2 tw:text-2xl tw:font-extrabold">pemuda bekerja di KJDP</span>
          </p>
          <p className="tw:max-w-[56ch] tw:text-[17px] tw:leading-relaxed lp-justify tw:text-on-deep-soft">Setiap pekerja KJDP menjadi pendamping utama bagi dua koperasi dan cadangan bagi dua koperasi lain. Jumlah pemuda adalah jumlah Kopdes dibagi dua, dibulatkan ke atas.</p>
        </Reveal>
        <Reveal delay={0.08} className="tw:lg:col-span-7 tw:flex tw:flex-col tw:gap-6">
          <div className="tw:rounded-card tw:bg-deep-2 tw:p-5">
            <div className="tw:mb-4 tw:flex tw:flex-wrap tw:items-baseline tw:justify-between tw:gap-2">
              <b className="tw:text-lg">Peta penugasan</b>
              <span className="tw:text-sm tw:text-on-deep-soft">titik kuning = satu pemuda; kotak = Kopdes yang ia dampingi sebagai pendamping utama</span>
            </div>
            <ul className="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:gap-2 tw:p-0" aria-label={`${n} koperasi dibagi ke ${pemuda} pemuda`}>
              {kelompok.map((k, i) => (
                <motion.li key={i} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
                  className="tw:flex tw:items-center tw:gap-1 tw:rounded-ctl tw:bg-deep tw:p-1.5" title={`Pemuda ${i + 1}: ${k} Kopdes utama`}>
                  <span className="tw:block tw:size-5 tw:rounded-full tw:bg-amber" aria-hidden="true" />
                  {Array.from({ length: k }, (_, j) => <span key={j} className="tw:block tw:size-5 tw:rounded-[4px] tw:bg-on-deep-soft" aria-hidden="true" />)}
                </motion.li>
              ))}
            </ul>
          </div>
          <dl className="tw:m-0 tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-3">
            {[[String(n * 2), 'penugasan: ' + n + ' utama dan ' + n + ' cadangan'], ['2 orang', 'melayani setiap koperasi, jadi pendampingan tidak berhenti saat satu orang pergi'], [n >= 30 ? Math.ceil(30 / 2) + ' dari ' + pemuda : String(pemuda), n >= 30 ? 'pemuda yang dibutuhkan pilot 30 Kopdes (target K5)' : 'pemuda untuk ' + n + ' Kopdes']].map(([v, l]) => (
              <div key={l} className="tw:rounded-card tw:bg-deep-2 tw:p-4"><dt className="tw:text-[28px] tw:font-extrabold tw:tracking-tight tw:tabular-nums">{v}</dt><dd className="tw:m-0 tw:mt-1 tw:text-sm tw:text-on-deep-soft">{l}</dd></div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Pilot dan KPI ---------------- */
function Pilot() {
  const kpi = [['K1', '27 dari 30 Kopdes menerbitkan laporan bulanan paling lambat tanggal 10, minimal 10 dari 12 bulan.'], ['K2', '60% anggota membuka ringkasan saldonya sekali per kuartal.'],
    ['K3', '90% Kopdes menggelar RAT dengan laporan dibagikan tujuh hari sebelumnya.'], ['K4', 'Seluruh status Perlu tindakan ditindaklanjuti dalam 14 hari.'], ['K5', '15 pemuda bekerja di KJDP dengan upah sesuai UMK kabupaten.']];
  const fase = [['Bulan 1 sampai 3', 'KJDP didirikan, anggotanya dilatih, perjanjian ditandatangani dengan dinas koperasi dan Kopdes peserta.'], ['Bulan 4 sampai 9', 'Buku besar dipasang, skor bulanan terbit, RAT pertama digelar dengan paket dibagikan lebih dahulu.'], ['Bulan 10 sampai 12', 'Hasil dievaluasi bersama dinas untuk replikasi ke kabupaten lain.']];
  return (
    <section aria-labelledby="lp-pilot-h" className={WRAP + ' ' + GAP + ' tw:grid tw:gap-10 tw:md:grid-cols-12 tw:items-start'}>
      <Reveal className="tw:md:col-span-6 tw:flex tw:flex-col tw:gap-7">
        <SectionTitle id="lp-pilot-h">Pilot 12 bulan, 30 Kopdes, lima ukuran</SectionTitle>
        <ol className="tw:m-0 tw:grid tw:list-none tw:gap-3 tw:p-0 tw:lg:grid-cols-3">
          {fase.map(([b, t]) => <li key={b} className="tw:rounded-card tw:bg-surface tw:p-4"><b className="tw:block tw:text-brand-ink">{b}</b><span className="tw:text-[15px]">{t}</span></li>)}
        </ol>
        <dl className="tw:m-0 tw:grid tw:gap-2">
          {kpi.map(([k, t]) => <div key={k} className="tw:grid tw:grid-cols-[56px_1fr] tw:items-baseline tw:gap-4 tw:rounded-card tw:bg-surface tw:px-4 tw:py-3.5"><dt className="tw:text-xl tw:font-extrabold tw:text-brand-ink">{k}</dt><dd className="tw:m-0">{t}</dd></div>)}
        </dl>
      </Reveal>
      <Reveal delay={0.08} as="figure" className="tw:m-0 tw:md:col-span-5 tw:md:col-start-8 tw:lg:sticky tw:lg:top-[12vh]">
        <Foto src="img/balai.jpg" alt="Balai Desa Pandansari di Kabupaten Malang, bangunan putih berpilar biru di atas tembok batu" w={960} h={720} className="tw:aspect-[4/3]" />
        <figcaption className="tw:mt-3 tw:text-[15px] tw:text-body">Balai desa, tempat RAT tatap muka digelar. e-RAT melengkapinya, tidak menggantikannya.</figcaption>
      </Reveal>
    </section>
  );
}

/* ---------------- Surat penggagas ---------------- */
function Surat() {
  return (
    <section aria-labelledby="lp-surat-h" className={WRAP + ' ' + GAP + ' tw:grid tw:gap-10 tw:md:grid-cols-12 tw:items-center'}>
      <Reveal as="figure" className="tw:m-0 tw:md:col-span-6">
        <Foto src="img/sawah.jpg" alt="Petani menanam padi di sawah berair di Desa Gebangsari, Banyumas" w={960} h={720} className="tw:aspect-[4/3] tw:lg:aspect-[4/5]" />
      </Reveal>
      <Reveal delay={0.08} className="tw:md:col-span-6 tw:md:col-start-7 tw:flex tw:flex-col tw:gap-4">
        <SectionTitle id="lp-surat-h">Mengapa koperasi pemuda</SectionTitle>
        <span aria-hidden="true" className="tw:grid tw:size-11 tw:place-items-center tw:rounded-full tw:bg-brand tw:text-[13px] tw:font-bold tw:text-white">MY</span>
        <p className="tw:text-[17px] tw:leading-relaxed lp-justify">Program magang dan KKN mendekatkan mahasiswa dengan koperasi, tetapi penempatannya sementara, sedangkan pembukuan menuntut kesinambungan setiap bulan. Perangkat lunak saja juga tidak menjamin kebiasaan memakainya.</p>
        <p className="tw:text-[17px] tw:leading-relaxed lp-justify">Karena itu saya mengusulkan Koperasi Jasa Digital Pemuda di tingkat kabupaten. Pemudanya menjadi anggota sekaligus pekerja, memperoleh pendapatan dari tarif layanan yang disepakati dalam RAT, dan berkepentingan agar koperasi yang didampinginya tetap sehat.</p>
        <p className="tw:text-[17px] tw:leading-relaxed lp-justify">KJDP menghitung skor koperasi yang juga membayar jasanya. Supaya penilaiannya tetap jujur, rumus skor dibuka untuk pengawas dan dinas, dan dinas bisa menghitung ulang dari data yang sama untuk memastikan hasilnya cocok.</p>
        <p className="tw:mt-2 tw:text-2xl tw:font-bold tw:italic">Muhammad Yusuf Arrayyan</p>
        <p className="tw:text-sm tw:text-body">Penggagas, Universitas Bengkulu · esai COOPFEST 2026</p>
      </Reveal>
    </section>
  );
}

/* ---------------- Pijakan ---------------- */
function Pijakan() {
  const t = [['PEARLS', 'Evans dan Branch, 2002'], ['UU 27/2022', 'Pelindungan Data Pribadi'], ['SDGs 16.6', 'Kelembagaan akuntabel'], ['SDGs 16.7', 'Keputusan partisipatif'], ['SDGs 8.6', 'Pemuda bekerja'], ['SDGs 17.17', 'Kemitraan']];
  return (
    <section aria-labelledby="lp-proof-h" className={WRAP + ' ' + GAP}>
      <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:lg:grid-cols-4">
        <Reveal className="tw:col-span-2 tw:flex tw:min-h-[120px] tw:items-start tw:rounded-card tw:bg-brand tw:p-6 tw:text-white"><SectionTitle id="lp-proof-h" className="tw:text-white">Pijakan rancangan</SectionTitle></Reveal>
        {t.map(([b, s], i) => (
          <Reveal key={b} delay={i * 0.04} className="tw:flex tw:min-h-[132px] tw:flex-col tw:justify-between tw:gap-2 tw:rounded-card tw:bg-surface-2 tw:p-4 tw:sm:p-6 tw:lg:aspect-[3/2]">
            <b className="tw:text-[clamp(1.25rem,2.2vw,2rem)] tw:leading-[1.05] tw:font-extrabold tw:tracking-tight">{b}</b><span className="tw:font-medium tw:text-body">{s}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Cara pakai: video demo, PDF panduan, akun demo ---------------- */
const AKUN_DEMO = [['Anggota', 'Siti Aminah · SKM-004'], ['Pengurus', 'Rina Wulandari'], ['Pengawas', 'Hendra Gunawan'], ['Pendamping KJDP', 'Dimas Pratama'], ['Dinas Koperasi', 'Ratih Kusumawardani']];
const SKENARIO = [
  ['Pemulihan', 'Anggota melihat status Waspada; pengurus mencatat angsuran saat luring, menyinkronkan, menutup buku Oktober; pengawas mengesahkan.'],
  ['Rapat anggota tahunan', 'Paket RAT terbit dan terkunci, anggota hadir dengan kode dan memberi suara, berita acara terbentuk otomatis.'],
  ['Dinas Koperasi', 'Memantau 30 koperasi, menghitung ulang skor Sukamaju sampai hasilnya sama, lalu mengunduh CSV dan JSON.'],
  ['Perlu tindakan', 'Penarikan dan beban besar membuat skor turun ke 36; tiket tindak lanjut bertenggat 14 hari muncul di beranda anggota.']
];

function Panduan() {
  const luring = typeof location !== 'undefined' && location.protocol === 'file:';
  return (
    <section id="lp-panduan" aria-labelledby="lp-panduan-h" className={WRAP + ' ' + GAP}>
      <Reveal className="tw:flex tw:flex-col tw:gap-3 tw:lg:max-w-[62ch]">
        <SectionTitle id="lp-panduan-h">Cara pakai prototipe</SectionTitle>
        <p className="tw:text-[17px] tw:leading-relaxed lp-justify">Tonton demo tiga menit yang menjalankan sistem dari awal sampai akhir, atau unduh panduan PDF bergambar. Prototipe tidak memakai kata sandi: pilih salah satu akun demo di layar Masuk.</p>
      </Reveal>
      <div className="tw:mt-8 tw:grid tw:grid-cols-1 tw:gap-8 tw:lg:grid-cols-12 tw:lg:items-start">
        <Reveal delay={0.06} as="figure" className="tw:m-0 tw:min-w-0 tw:lg:col-span-7">
          <video controls preload="none" playsInline poster="panduan/video-demo-poster.jpg" className="tw:block tw:aspect-video tw:w-full tw:rounded-card tw:bg-deep">
            <source src="panduan/video-demo-terang-kop.mp4" type="video/mp4" />
            Peramban Anda tidak bisa memutar video ini. <a href="panduan/video-demo-terang-kop.mp4">Unduh videonya</a>.
          </video>
          <figcaption className="tw:mt-3 tw:text-[15px] tw:text-body">Video demo 3 menit 9 detik, bersuara dan bersubtitle bahasa Indonesia. Semua data dalam video adalah simulasi.</figcaption>
        </Reveal>
        <Reveal delay={0.1} className="tw:min-w-0 tw:lg:col-span-5 tw:flex tw:flex-col tw:gap-5">
          <div className="tw:flex tw:flex-wrap tw:gap-3">
            <a href="panduan/panduan-penggunaan-terang-kop.pdf" download className="tw:inline-flex tw:min-h-12 tw:items-center tw:gap-2 tw:rounded-full tw:bg-brand tw:px-6 tw:font-semibold tw:text-white tw:no-underline tw:transition tw:hover:brightness-110 tw:active:scale-[.98]">
              <Icon name="download" />Unduh panduan PDF
            </a>
            <a href="panduan/panduan-penggunaan-terang-kop.pdf" target="_blank" rel="noopener" className="tw:inline-flex tw:min-h-12 tw:items-center tw:rounded-full tw:border tw:border-line-strong tw:bg-surface tw:px-6 tw:font-semibold tw:text-ink tw:no-underline tw:transition tw:hover:bg-surface-2">Buka di tab baru</a>
          </div>
          <p className="tw:-mt-2 tw:text-sm tw:text-body">PDF 9 halaman, 2,6 MB: cara membuka, akun demo, empat skenario langkah demi langkah dengan tangkapan layar.</p>
          <div className="tw:rounded-card tw:bg-surface tw:p-5">
            <b className="tw:block tw:text-lg">Akun demo</b>
            <p className="tw:mb-3 tw:text-sm tw:text-body">Tanpa kata sandi. Tekan <b>Coba prototipe</b>, pilih peran, lalu Masuk.</p>
            <dl className="tw:m-0 tw:grid tw:grid-cols-[max-content_1fr] tw:gap-x-5 tw:gap-y-2 tw:text-[15px]">
              {AKUN_DEMO.map(([p, n]) => <div key={p} className="tw:contents"><dt className="tw:text-mute">{p}</dt><dd className="tw:m-0 tw:font-semibold">{n}</dd></div>)}
            </dl>
          </div>
          {luring && <p className="tw:text-sm tw:text-body">Halaman ini dibuka dari berkas luring. Video dan PDF tersedia di terang-kop.onrender.com.</p>}
        </Reveal>
      </div>
      <Reveal delay={0.08} className="tw:mt-10">
        <h3 className="tw:mb-4 tw:text-xl tw:font-bold">Empat skenario yang bisa dicoba</h3>
        <ol className="tw:m-0 tw:grid tw:grid-cols-1 tw:gap-x-10 tw:gap-y-5 tw:pl-6 tw:md:grid-cols-2 tw:marker:font-extrabold tw:marker:text-brand-ink">
          {SKENARIO.map(([j, t]) => <li key={j} className="tw:pl-1"><b className="tw:block tw:text-lg">{j}</b><span className="tw:text-[15px] tw:text-body">{t}</span></li>)}
        </ol>
        <p className="tw:mt-4 tw:text-sm tw:text-body">Di dalam aplikasi, tombol <b>Panel demo</b> di kanan bawah menjalankan setiap skenario dengan satu tekan dan bisa mengatur ulang semua data.</p>
      </Reveal>
    </section>
  );
}

/* ---------------- Masuk ---------------- */
function Ajakan({ d }) {
  const App = window.App;
  const [peran, setPeran] = useState('ANG');
  const [anggota, setAnggota] = useState('A04');
  const masuk = (e) => {
    e.preventDefault();
    App.session = { peran, anggota_id: peran === 'ANG' ? anggota : null };
    App.saveSession();
    const P = App.PERAN[peran];
    location.hash = '#/' + P.kode + '/' + P.nav[0][0];
  };
  return (
    <section aria-labelledby="lp-cta-h" className={GAP + ' tw:bg-brand tw:py-20 tw:text-white'}>
      <div className={WRAP + ' tw:grid tw:items-end tw:gap-10 tw:lg:grid-cols-12'}>
        <Reveal className="tw:lg:col-span-5 tw:flex tw:flex-col tw:gap-5">
          <h2 id="lp-cta-h" className="tw:text-[clamp(3.25rem,6.4vw,6rem)] tw:leading-[.94] tw:font-extrabold tw:tracking-[-0.04em] tw:text-white">Buka bukunya</h2>
          <p className="tw:max-w-[40ch] tw:text-[17px]">Pilih peran, lalu jalankan skenario demo dari tombol Panel demo. Semua data simulasi; tidak ada data koperasi nyata.</p>
        </Reveal>
        <Reveal delay={0.08} as="form" onSubmit={masuk} data-ui className="tw:lg:col-span-5 tw:lg:col-start-7 tw:flex tw:w-full tw:max-w-[460px] tw:flex-col tw:gap-4 tw:rounded-card tw:bg-surface tw:p-6 tw:text-ink tw:shadow-[var(--shadow-pop)]">
          <h3 className="tw:text-xl tw:font-bold">Masuk ke prototipe</h3>
          <p className="tw:text-sm tw:text-body">Di prototipe ini tidak ada kata sandi. Pilih peran, lalu masuk.</p>
          <fieldset className="tw:m-0 tw:border-0 tw:p-0">
            <legend className="tw:mb-2 tw:text-[15px] tw:font-semibold">Peran</legend>
            <div className="tw:flex tw:flex-wrap tw:gap-1 tw:rounded-card tw:bg-surface-2 tw:p-1">
              {['ANG', 'PNG', 'PGW', 'KJD', 'DIN'].map((k) => (
                <label key={k} className="tw:flex-auto">
                  <input type="radio" name="peran" value={k} checked={peran === k} onChange={() => setPeran(k)} className="tw:peer tw:sr-only" />
                  <span className="tw:grid tw:min-h-11 tw:cursor-pointer tw:place-items-center tw:rounded-full tw:px-3 tw:text-sm tw:font-semibold tw:text-body tw:transition tw:hover:bg-surface-3 tw:peer-checked:bg-surface tw:peer-checked:text-ink tw:peer-checked:outline tw:peer-checked:outline-line tw:peer-focus-visible:outline-3 tw:peer-focus-visible:outline-[var(--focus)]">
                    {App.PERAN[k].nama.replace('Pendamping KJDP', 'Pendamping').replace('Dinas Koperasi', 'Dinas')}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {peran === 'ANG' && (
            <div className="tw:flex tw:flex-col tw:gap-1.5">
              <label htmlFor="lp-anggota" className="tw:text-[15px] tw:font-semibold">Anggota</label>
              <select id="lp-anggota" value={anggota} onChange={(e) => setAnggota(e.target.value)} className="tw:min-h-12 tw:rounded-ctl tw:border tw:border-line-strong tw:bg-surface tw:px-3 tw:text-base tw:text-ink">
                {d.s.anggota.map((a) => <option key={a.id} value={a.id}>{a.nama} · {a.no}</option>)}
              </select>
            </div>
          )}
          <button type="submit" id="lp-go" className="tw:min-h-13 tw:cursor-pointer tw:rounded-full tw:border-0 tw:bg-brand tw:px-6 tw:text-base tw:font-semibold tw:text-white tw:transition tw:hover:brightness-110 tw:active:scale-[.98]">Buka sebagai {App.PERAN[peran].nama}</button>
        </Reveal>
      </div>
    </section>
  );
}

function Kaki() {
  return (
    <>
      <p className={WRAP + ' tw:mt-12 tw:text-sm tw:text-body'}><span className="tw:block tw:max-w-[90ch]">Foto: “Tugu Koperasi Indonesia (1)” oleh Mirani Pramitasari; “Warung Biru - Desa Ngawonggo” oleh Hngdery; “Village Meeting Hall of Pandansari” oleh ShinyFiver (CC BY-SA 4.0); “Bms rice planting 141229-47913 rwg” oleh Wie146 (CC BY-SA 3.0); semuanya via Wikimedia Commons.</span></p>
      <p aria-hidden="true" translate="no" className={WRAP + ' tw:mt-20 tw:overflow-hidden tw:whitespace-nowrap tw:text-[clamp(3.5rem,13.8vw,12.5rem)] tw:leading-[.82] tw:font-extrabold tw:tracking-[-0.05em] tw:text-brand'}>TERANG-KOP</p>
      <footer className={WRAP + ' tw:grid tw:gap-2 tw:py-8 tw:text-[15px] tw:text-body tw:md:grid-cols-[1fr_auto_1fr] tw:md:items-baseline'}>
        <span>TERANG-KOP · prototipe esai COOPFEST 2026</span>
        <nav aria-label="Tautan kaki" className="tw:flex tw:gap-6">
          <a href="#/masuk" className="tw:min-h-11 tw:inline-flex tw:items-center tw:font-semibold tw:text-ink">Masuk</a>
          <a href="https://github.com/YusufArrayyan/TERANG-KOP" className="tw:min-h-11 tw:inline-flex tw:items-center tw:font-semibold tw:text-ink">Kode sumber</a>
        </nav>
        <span className="tw:md:text-right">2026 · data simulasi, tanpa data pribadi nyata</span>
      </footer>
    </>
  );
}

/* Foto warung: skala usaha yang dibukukan, di antara cara kerja dan lembar keluaran. */
function FotoWarung() {
  return (
    <Reveal as="figure" className={WRAP + ' ' + GAP + ' tw:m-0 tw:grid tw:gap-6 tw:lg:grid-cols-12 tw:items-center'}>
      <Foto src="img/warung.jpg" alt="Warung bercat biru di Desa Ngawonggo, Malang, dengan pintu kayu terbuka" w={1100} h={619} className="tw:aspect-[21/9] tw:lg:col-span-8" />
      <figcaption className="tw:lg:col-span-4 tw:text-[17px] tw:leading-relaxed tw:text-body">Warung di Desa Ngawonggo, Malang. Gerai Kopdes mencatat penjualan dan pembelian barang sebesar ini setiap hari, dan setiap catatan ikut menentukan skor bulanannya.</figcaption>
    </Reveal>
  );
}

export default function Landing() {
  const d = useMemo(() => data(), []);
  return (
    <MotionConfig reducedMotion="user">
      <div className="lp-root tw:font-sans">
        <Hero d={d} />
        <main id="konten" className="tw:p-0">
          <Angka />
          <Coba d={d} />
          <Masalah />
          <Pelengkap d={d} />
          <CaraKerja d={d} />
          <FotoWarung />
          <Keluaran d={d} />
          <Kjdp />
          <Pilot />
          <Surat />
          <Pijakan />
          <Panduan />
          <Ajakan d={d} />
          <Kaki />
        </main>
      </div>
    </MotionConfig>
  );
}
