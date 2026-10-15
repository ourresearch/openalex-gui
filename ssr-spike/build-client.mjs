// oxjob #1689 SSR spike: does the CLIENT also build with Vite? (production
// would need server and client compiled by the same SFC compiler, see notes)
import { build } from 'vite';
import config from './vite.config.mjs';
const t0 = performance.now();
await build({
  ...config,
  mode: 'production',
  logLevel: 'warn',
  build: {
    outDir: 'ssr-spike/dist-client',
    emptyOutDir: true,
    manifest: true,
    sourcemap: false,
    rollupOptions: { input: { main: 'src/main.js', hydrate: 'src/entry-client.js' } },
  },
});
console.log(`client built in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
