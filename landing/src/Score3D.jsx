import { useEffect, useRef, useState } from 'react';
import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, Mesh, Group, AmbientLight, DirectionalLight, Color, DoubleSide } from 'three';
import { STATUS } from './ui.jsx';
import { bulan } from './data.js';

/* Warna token aplikasi ditulis dalam OKLCH; three.js butuh RGB. Ubah lewat kanvas 1 piksel. */
function tokenRGB(cssVar) {
  const probe = document.createElement('span');
  probe.style.color = `var(${cssVar})`;
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new Color(r / 255, g / 255, b / 255);
}
const VAR = { 'Sehat': '--ok-mark', 'Waspada': '--warn-mark', 'Perlu tindakan': '--bad-mark', 'Dikalibrasi': '--cal-mark' };

/* Riwayat skor Sukamaju Januari sampai September sebagai batang 3D. Datanya dari buku besar simulasi. */
export default function Score3D({ riwayat }) {
  const wrap = useRef(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    let renderer;
    try { renderer = new WebGLRenderer({ antialias: true, alpha: true }); } catch { setGagal(true); return undefined; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 3.1, 9.6);
    camera.lookAt(0, 1.3, 0);
    scene.add(new AmbientLight(0xffffff, 1.25));
    const sun = new DirectionalLight(0xffffff, 1.6); sun.position.set(4, 8, 6); scene.add(sun);

    const g = new Group(); scene.add(g);
    const n = riwayat.length, gap = 0.82, H = 3.2;
    const geos = [], mats = [];
    const base = new Mesh(new BoxGeometry(n * gap + 0.6, 0.08, 1.4), new MeshStandardMaterial({ color: new Color(0.13, 0.27, 0.23), roughness: 0.9 }));
    base.position.y = -0.04; g.add(base); geos.push(base.geometry); mats.push(base.material);
    riwayat.forEach((b, i) => {
      const h = Math.max(0.05, (b.nilai / 100) * H);
      const geo = new BoxGeometry(0.52, h, 0.52);
      const mat = new MeshStandardMaterial({ color: tokenRGB(VAR[b.status] || '--brand'), roughness: 0.55, metalness: 0.05 });
      const m = new Mesh(geo, mat);
      m.position.set((i - (n - 1) / 2) * gap, h / 2, 0);
      g.add(m); geos.push(geo); mats.push(mat);
    });
    // Ambang status: 80 Sehat, 55 Waspada (tipis, transparan)
    [[80, '--ok-mark'], [55, '--warn-mark']].forEach(([v, cv]) => {
      const geo = new PlaneGeometry(n * gap + 0.6, 1.4);
      const mat = new MeshBasicMaterial({ color: tokenRGB(cv), transparent: true, opacity: 0.16, side: DoubleSide, depthWrite: false });
      const p = new Mesh(geo, mat); p.rotation.x = -Math.PI / 2; p.position.y = (v / 100) * H; g.add(p); geos.push(geo); mats.push(mat);
    });

    const ukur = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    };
    ukur();
    const ro = new ResizeObserver(ukur); ro.observe(el);

    const diam = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let drag = null, putar = 0, terlihat = true, raf = 0, t0 = performance.now();
    const down = (e) => { drag = { x: e.clientX, r: putar }; el.setPointerCapture?.(e.pointerId); };
    const move = (e) => { if (drag) putar = drag.r + (e.clientX - drag.x) / 160; };
    const up = () => { drag = null; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    const io = new IntersectionObserver(([en]) => { terlihat = en.isIntersecting; if (terlihat && !raf && !diam) raf = requestAnimationFrame(loop); }, { threshold: 0 });
    io.observe(el);

    function loop(now) {
      raf = 0;
      const t = (now - t0) / 1000;
      g.rotation.y = putar + (drag ? 0 : Math.sin(t * 0.35) * 0.32) - 0.25;
      renderer.render(scene, camera);
      if (terlihat && !diam) raf = requestAnimationFrame(loop);
    }
    if (diam) { g.rotation.y = -0.35; renderer.render(scene, camera); } else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      geos.forEach((x) => x.dispose()); mats.forEach((x) => x.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, [riwayat]);

  const label = 'Riwayat skor Kopdes Sukamaju: ' + riwayat.map((b) => bulan(b.periode) + ' ' + b.nilai + ' ' + b.status).join(', ');
  return (
    <figure className="tw:m-0 tw:flex tw:flex-col tw:gap-3">
      <div ref={wrap} role="img" aria-label={label} className="tw:relative tw:h-[clamp(220px,34vh,340px)] tw:w-full tw:cursor-grab tw:touch-pan-y tw:active:cursor-grabbing">
        {gagal && (
          <div className="tw:absolute tw:inset-0 tw:flex tw:items-end tw:gap-1.5 tw:px-2">
            {riwayat.map((b) => (
              <i key={b.periode} className={'tw:block tw:flex-1 tw:rounded-t-md ' + (b.status === 'Dikalibrasi' ? 'lp-hatch' : '')} style={{ height: b.nilai + '%', background: b.status === 'Dikalibrasi' ? undefined : STATUS[b.status].mark }} />
            ))}
          </div>
        )}
      </div>
      <div className="tw:grid tw:gap-1 tw:text-center tw:text-[13px] tw:text-on-deep-soft" style={{ gridTemplateColumns: `repeat(${riwayat.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {riwayat.map((b) => <span key={b.periode}><b className="tw:block tw:text-[15px] tw:text-on-deep tw:tabular-nums">{b.nilai}</b>{bulan(b.periode).slice(0, 3)}</span>)}
      </div>
      <figcaption className="tw:text-sm tw:text-on-deep-soft">Riwayat skor Kopdes Sukamaju, Januari sampai September 2026. Batang biru: tiga bulan kalibrasi; bidang tipis menandai ambang 80 (Sehat) dan 55 (Waspada). Seret untuk memutar.</figcaption>
    </figure>
  );
}
