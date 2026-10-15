// oxjob #1689 SSR spike: production-mode server bundle of src/entry-server.js
// (Vite SSR build), to measure render time without dev-mode overhead.
import { build } from 'vite';
import config from './vite.config.mjs';
const t0 = performance.now();
await build({
  ...config,
  mode: 'production',
  logLevel: 'info',
  build: {
    ssr: 'src/entry-server.js',
    outDir: 'ssr-spike/dist-server',
    emptyOutDir: true,
    minify: false,
    rollupOptions: { output: { format: 'esm', entryFileNames: 'entry-server.mjs' } },
  },
});
console.log(`server bundle built in ${((performance.now() - t0) / 1000).toFixed(1)} s, peak-ish rss ${(process.memoryUsage().rss / 1e6).toFixed(0)} MB`);
