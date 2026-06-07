import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';
import fs from 'fs';

/** CSP di index.html memblokir script inline Vite/React Refresh — hapus saat dev */
function stripCspInDev() {
  return {
    name: 'strip-csp-in-dev',
    transformIndexHtml(html: string, ctx: { server?: unknown }) {
      if (!ctx.server) return html;
      return html.replace(
        /\s*<meta\s+http-equiv="Content-Security-Policy"[^>]*>\s*/i,
        '\n'
      );
    },
  };
}

/** Salin pdf.js worker ke public — hindari esbuild transform file 1.3MB saat HMR */
function copyPdfWorker() {
  const src = path.resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
  const destDir = path.resolve('public');
  const dest = path.join(destDir, 'pdf.worker.min.mjs');

  return {
    name: 'copy-pdf-worker',
    buildStart() {
      if (!fs.existsSync(src)) return;
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
    },
  };
}

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  plugins: [
    react(),
    stripCspInDev(),
    copyPdfWorker(),
    electron({
      onstart({ startup }) {
        const url = process.env.VITE_DEV_SERVER_URL ?? 'http://127.0.0.1:5173';
        console.log('[Notes] Memulai Electron — dev server:', url);
        startup();
      },
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3'],
              output: {
                inlineDynamicImports: true,
              },
            },
            commonjsOptions: {
              transformMixedEsModules: true,
            },
          },
        },
      },
      preload: { input: 'electron/preload.ts' },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('pdfjs-dist')) return 'pdfjs';
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'editor';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
        },
      },
    },
  },
});
