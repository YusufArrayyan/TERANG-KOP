// Menggabungkan src/ menjadi satu berkas: dist/terang-kop.html
// Jalankan: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(root, 'src', p), 'utf8');
let html = src('index.html');

const logo = src('logo.svg').replace(/\s+/g, ' ').trim();
html = html.replace('<link rel="icon" href="logo.svg" type="image/svg+xml">',
  `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(logo)}">`);
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, p) => `<style>\n${src(p)}\n</style>`);
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, p) => `<script>\n${src(p).replace(/<\/script/gi, '<\\/script')}\n</script>`);

// Foto halaman depan disisipkan sebagai data URI agar berkas tunggal tetap bisa dibuka luring.
const img = (p) => `data:image/jpeg;base64,${readFileSync(join(root, 'src', p)).toString('base64')}`;
html = html.replace(/(["'])(img\/[a-z0-9-]+\.jpg)\1/g, (_, q, p) => q + img(p) + q);
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'terang-kop.html'), html);
// Salinan untuk hosting statis (Render): alamat utama langsung membuka prototipe.
writeFileSync(join(root, 'dist', 'index.html'), html);
console.log('dist/terang-kop.html', (Buffer.byteLength(html) / 1024).toFixed(1), 'KB');
