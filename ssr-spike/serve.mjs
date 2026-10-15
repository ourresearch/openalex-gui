// oxjob #1689 SSR spike: dev server that server-renders record routes and
// serves the client entry so the browser hydrates them (Vite middleware mode).
// Usage: node ssr-spike/serve.mjs [port]
import express from 'express';
import fs from 'node:fs';
import { createServer } from 'vite';
import config from './vite.config.mjs';

const port = Number(process.argv[2] || 5189);
const key = process.env.OPENALEX_API_KEY;
const vite = await createServer({
  ...config,
  // the browser side needs CommonJS deps (axios 0.27, etc.) pre-bundled
  optimizeDeps: {},
  server: { middlewareMode: true, hmr: false },
});
const { default: axios } = await import('axios');
axios.interceptors.request.use((cfg) => {
  if (key) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${key}` };
  return cfg;
});

const app = express();
app.use(express.json({ limit: '5mb' }));
app.post('/__hydration-report', (req, res) => {
  const out = `/tmp/ssr1689/hydration-${req.body.path.replace(/\W+/g, '_')}.json`;
  fs.writeFileSync(out, JSON.stringify(req.body, null, 2));
  console.log('hydration report ->', out, 'warnings:', req.body.warnings.length, 'errors:', req.body.errors.length);
  res.json({ ok: true });
});

// Simulate a returning logged-in visitor: token + cached /users/me in localStorage.
app.get('/__login-sim', (req, res) => {
  const me = { id: 'u-spike-1689', name: 'Spike Tester', email: 'spike@example.org', feature_flags: [] };
  res.type('html').send(`<script>localStorage.setItem('token','fake-token-1689');
localStorage.setItem('userCache', JSON.stringify({ token: 'fake-token-1689', me: ${JSON.stringify(me)} }));
location.replace(${JSON.stringify(String(req.query.to || '/'))});</script>`);
});
app.get('/__logout-sim', (req, res) => {
  res.type('html').send(`<script>localStorage.clear(); location.replace(${JSON.stringify(String(req.query.to || '/'))});</script>`);
});

const RECORD = /^\/(works|authors|sources|institutions|topics|funders|publishers)\/[A-Za-z]?\d+$/;
app.use(async (req, res, next) => {
  if (req.method !== 'GET' || !RECORD.test(req.path)) return next();
  try {
    const mod = await vite.ssrLoadModule('/src/entry-server.js');
    const apiPath = req.path.slice(1);
    const apiUrl = mod.api.makeUrl(apiPath);
    const r = await fetch(apiUrl, { headers: key ? { Authorization: `Bearer ${key}` } : {} });
    if (r.status === 404) return next();
    const data = await r.json();
    const t0 = performance.now();
    const out = await mod.render(req.originalUrl, { seed: { [apiUrl]: data } });
    const ms = performance.now() - t0;
    // Everything the server rendered from (the record + any list the page awaited),
    // so the client's first render has the same data.
    const apiCache = mod.apiCacheSnapshot();
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
${out.headTags.headTags}
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
</head><body${out.headTags.bodyAttrs}>
<div id="app">${out.html}</div>
<script>window.__API_CACHE__ = ${JSON.stringify(apiCache).replace(/</g, '\\u003c')};</script>
<script type="module" src="/@vite/client"></script>
<script type="module" src="/src/entry-client.js"></script>
</body></html>`;
    res.set('Server-Timing', `render;dur=${ms.toFixed(1)}`).type('html').send(html);
    console.log(`SSR ${req.path} render ${ms.toFixed(1)} ms, html ${html.length} bytes`);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    console.error(e);
    next(e);
  }
});
app.use(vite.middlewares);
app.listen(port, () => console.log(`spike server on http://localhost:${port}`));
