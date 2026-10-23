// Titik masuk halaman depan. Aplikasi (src/js/landing-mount.js) memanggil mount() saat rute #/ dibuka.
import { createRoot } from 'react-dom/client';
import Landing from './Landing.jsx';
import './styles.css';

let root = null;
let host = null;

export function mount(el) {
  if (root && host === el) return;
  unmount();
  host = el;
  root = createRoot(el);
  root.render(<Landing />);
}

export function unmount() {
  if (root) { root.unmount(); root = null; host = null; }
}
