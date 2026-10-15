// oxjob #1689 SSR spike: load src/entry-server.js through Vite and render one
// record page. Usage: node ssr-spike/render.mjs /works/W2741809807 out.html
import { createServer } from 'vite';
import config from './vite.config.mjs';
import fs from 'node:fs';
import { install, setPhase, sites } from './browser-globals-shim.mjs';
import { createRequire } from 'node:module';
// Load sass before the browser-global shims exist: dart2js sniffs for `window`/`document`.
createRequire(new URL('../package.json', import.meta.url))('sass');
if (process.env.SHIM !== '0') install();

const [,, path = '/works/W2741809807', out] = process.argv;
const t0 = performance.now();
const vite = await createServer(config);
let mod;
try {
  mod = await vite.ssrLoadModule('/src/entry-server.js');
} catch (e) {
  console.error('LOAD FAILED:', e.stack || e);
  await vite.close();
  process.exit(1);
}
const tLoad = performance.now();
setPhase('render');
console.error(`module graph loaded in ${(tLoad - t0).toFixed(0)} ms`);

// Fetch the record once, outside Vue, the way server.js would.
const { api } = mod;
const apiPath = path.replace(/^\//, '');
const apiUrl = api.makeUrl(apiPath);
const key = process.env.OPENALEX_API_KEY;
const res = await fetch(apiUrl + (key ? `&api_key=${key}` : ''));
const data = await res.json();
const tFetch = performance.now();
console.error(`fetched ${apiUrl.replace(/api_key=[^&]+/, 'api_key=…')} (${res.status}) in ${(tFetch - tLoad).toFixed(0)} ms`);

// Log every API call the app makes while rendering (should be none for a seeded work page).
const { default: axios } = await import('axios');
const calls = [];
// Server-side calls carry the server's API key in a header, added here and never
// put in the store (the store is serialized into the page for hydration).
axios.interceptors.request.use((cfg) => { if (key) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${key}` }; return cfg; });
axios.interceptors.request.use((cfg) => { calls.push({ url: cfg.url.replace(/api_key=[^&]+/, 'api_key=…'), t: performance.now() }); return cfg; });

const times = [];
let result;
for (let i = 0; i < 5; i++) {
  const t = performance.now();
  try {
    result = await mod.render(path, { seed: { [apiUrl]: data } });
  } catch (e) {
    console.error('RENDER FAILED:', e.stack || e);
    await vite.close();
    process.exit(1);
  }
  times.push(performance.now() - t);
  console.error(`run ${i + 1}: ${(performance.now() - t).toFixed(1)} ms, API calls during render so far: ${calls.length}`);
}
for (const c of calls) console.error('  API call from app:', c.url);
if (process.env.COMPONENTS) {
  const list = [];
  await mod.render(path, { seed: { [apiUrl]: data }, collectComponents: list });
  const counts = {};
  for (const f of list) counts[f] = (counts[f] || 0) + 1;
  fs.writeFileSync(process.env.COMPONENTS, JSON.stringify(counts, null, 1));
  console.error('components rendered:', list.length, 'distinct:', Object.keys(counts).length);
}
console.error('render ms (5 runs):', times.map(t => t.toFixed(1)).join(', '));
console.error('html bytes:', result.html.length);
if (out) {
  fs.writeFileSync(out, `<!doctype html><html><head>${result.headTags.headTags}</head><body${result.headTags.bodyAttrs}><div id="app">${result.html}</div></body></html>\n`);
  console.error('wrote', out);
}
if (process.env.SHIM !== '0') fs.writeFileSync('/tmp/ssr1689/globals-' + path.replace(/\W+/g, '_') + '.tsv', sites().join('\n') + '\n');
console.error('rss MB:', (process.memoryUsage().rss / 1e6).toFixed(0));
await vite.close();
