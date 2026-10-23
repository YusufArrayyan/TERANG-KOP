import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

/* Ikon dan logo memakai set yang sama dengan aplikasi (window.App) agar bahasanya satu. */
export function Icon({ name, size = 'sm', className = '' }) {
  return <span aria-hidden="true" className={'tw:inline-flex tw:shrink-0 ' + className} dangerouslySetInnerHTML={{ __html: window.App.icon(name, size) }} />;
}
export function Logo({ className = '' }) {
  return <span aria-hidden="true" className={'tw:inline-flex tw:[&>svg]:size-full ' + className} dangerouslySetInnerHTML={{ __html: window.App.LOGO }} />;
}

export const STATUS = {
  'Sehat': { ic: 'checkCircle', cls: 'tw:bg-ok-bg tw:text-ok-ink', mark: 'var(--ok-mark)' },
  'Waspada': { ic: 'alert', cls: 'tw:bg-warn-bg tw:text-warn-ink', mark: 'var(--warn-mark)' },
  'Perlu tindakan': { ic: 'octagon', cls: 'tw:bg-bad-bg tw:text-bad-ink', mark: 'var(--bad-mark)' },
  'Dikalibrasi': { ic: 'gauge', cls: 'tw:bg-cal-bg tw:text-cal-ink', mark: 'var(--cal-mark)' }
};

/* Status tidak pernah hanya warna: selalu ikon dan kata. */
export function StatusBadge({ status, lg }) {
  const m = STATUS[status] || STATUS.Sehat;
  return (
    <span className={'tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:font-semibold tw:whitespace-nowrap ' + m.cls + (lg ? ' tw:px-3.5 tw:py-1.5 tw:text-base' : ' tw:px-3 tw:py-1 tw:text-sm')}>
      <Icon name={m.ic} />{status}
    </span>
  );
}

const WARNA = { hijau: ['checkCircle', 'Hijau', 'tw:text-ok-ink'], kuning: ['alert', 'Kuning', 'tw:text-warn-ink'], merah: ['octagon', 'Merah', 'tw:text-bad-ink'] };
export function IndBadge({ warna }) {
  const w = WARNA[warna];
  return <span className={'tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:font-semibold tw:whitespace-nowrap ' + w[2]}><Icon name={w[0]} />{w[1]}</span>;
}

export function Gauge({ nilai, status, size = 76 }) {
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, nilai)) / 100);
  return (
    <div className="tw:relative tw:shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Skor ${nilai} dari 100, ${status}`}>
      <svg viewBox="0 0 120 120" className="tw:size-full tw:-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" stroke="var(--surface-3)" />
        <motion.circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" strokeLinecap="round" stroke={(STATUS[status] || STATUS.Sehat).mark}
          strokeDasharray={c} initial={false} animate={{ strokeDashoffset: off }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      </svg>
      <b className="tw:absolute tw:inset-0 tw:grid tw:place-items-center tw:text-[22px] tw:font-extrabold tw:tabular-nums tw:tracking-tight">{nilai}</b>
    </div>
  );
}

export function Chip({ children, tone = 'neutral', icon }) {
  const cls = { neutral: 'tw:bg-surface-2 tw:text-body', amber: 'tw:bg-amber-pale tw:text-amber-ink' }[tone];
  return <span className={'tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:px-2.5 tw:py-0.5 tw:text-[13px] tw:font-semibold tw:whitespace-nowrap ' + cls}>{icon && <Icon name={icon} />}{children}</span>;
}

/* Satu gaya animasi untuk seluruh halaman: geser naik pendek saat masuk layar.
 * Opasitas tidak pernah diubah, jadi isi selalu terlihat walau animasi tidak berjalan. */
export function Reveal({ as = 'div', children, className = '', delay = 0, ...rest }) {
  const M = motion[as];
  const ref = useRef(null);
  const [tunda, setTunda] = useState(false);
  const terlihat = useInView(ref, { once: true, amount: 'some' });
  useLayoutEffect(() => { if (ref.current && ref.current.getBoundingClientRect().top > window.innerHeight) setTunda(true); }, []);
  const naik = tunda && !terlihat;
  return (
    <M ref={ref} className={className} initial={false} animate={{ y: naik ? 20 : 0 }}
      transition={{ duration: naik ? 0 : 0.5, ease: [0.22, 1, 0.36, 1], delay: naik ? 0 : delay }} {...rest}>
      {children}
    </M>
  );
}

export function SectionTitle({ id, children, className = '' }) {
  return <h2 id={id} className={'tw:text-[clamp(1.75rem,2.6vw,2.375rem)] tw:leading-[1.12] tw:font-extrabold tw:tracking-[-0.02em] tw:text-balance ' + className}>{children}</h2>;
}
