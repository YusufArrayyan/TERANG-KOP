// Membangun halaman depan sebagai satu IIFE (window.TerangLanding) + satu CSS,
// lalu ../build.mjs menyisipkan keduanya ke berkas tunggal dist/terang-kop.html.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: '../src/landing',
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: true,
    lib: {
      entry: 'src/main.jsx',
      name: 'TerangLanding',
      formats: ['iife'],
      fileName: () => 'landing.js',
      cssFileName: 'landing'
    }
  }
});
