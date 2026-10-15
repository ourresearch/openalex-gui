// oxjob #1689 SSR spike: render benchmark on the production-mode server bundle
// (NODE_ENV=production node ssr-spike/bench.mjs). No Vite at runtime.
import fs from 'node:fs';
const mod = await import('./dist-server/entry-server.mjs');
const { default: axios } = await import('axios');
const key = process.env.OPENALEX_API_KEY;
let calls = 0;
axios.interceptors.request.use((cfg) => { calls++; if (key) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${key}` }; return cfg; });

const pages = ['/works/W2741809807', '/authors/A5023888391'];
const seeds = {};
for (const p of pages) {
  const u = mod.api.makeUrl(p.slice(1));
  const r = await fetch(u, { headers: key ? { Authorization: `Bearer ${key}` } : {} });
  seeds[p] = { [u]: await r.json() };
}
const titleOf = (out) => (out.headTags.headTags.match(/<title>(.*?)<\/title>/) || [])[1];

// 1) Sequential renders (the author page's works list is fetched on the first render, then cached).
const per = { [pages[0]]: [], [pages[1]]: [] };
const N = Number(process.env.N || 100);
for (let i = 0; i < N; i++) {
  for (const p of pages) {
    const t = performance.now();
    await mod.render(p, { seed: seeds[p] });
    per[p].push(performance.now() - t);
    // let the event loop turn between requests, as a server would
    await new Promise((r) => setTimeout(r, 5));
  }
}
const htmlBytes = {};
for (const p of pages) htmlBytes[p] = (await mod.render(p, { seed: seeds[p] })).html.length;
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))].toFixed(1); };
for (const p of pages) console.log(`${p}: app html ${htmlBytes[p]} bytes; n=${per[p].length} first=${per[p][0].toFixed(1)} ms p50=${pct(per[p].slice(1), 0.5)} ms p95=${pct(per[p].slice(1), 0.95)} ms`);
console.log(`API calls from inside renders: ${calls}; rss ${(process.memoryUsage().rss / 1e6).toFixed(0)} MB, heap ${(process.memoryUsage().heapUsed / 1e6).toFixed(0)} MB`);

// 2) Concurrency: render both pages at once, many times, and check each got its own title.
let wrong = 0, total = 0;
for (let i = 0; i < 20; i++) {
  const outs = await Promise.all(pages.map((p) => mod.render(p, { seed: seeds[p] }).then((o) => ({ p, t: titleOf(o) }))));
  for (const { p, t } of outs) {
    total++;
    const ok = p.startsWith('/works') ? /state of OA/i.test(t) : /Priem/.test(t);
    if (!ok) { wrong++; if (wrong <= 3) console.log(`  WRONG: ${p} rendered title "${t}"`); }
  }
}
console.log(`concurrent renders: ${wrong} of ${total} rendered the wrong page`);
