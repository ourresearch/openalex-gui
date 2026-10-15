// oxjob #1689 SSR spike: heap after GC as renders accumulate (leak check).
import v8 from 'node:v8';
const mod = await import('./dist-server/entry-server.mjs');
const p = process.argv[2] || '/works/W2741809807';
const u = mod.api.makeUrl(p.slice(1));
const key = process.env.OPENALEX_API_KEY;
const seed = { [u]: await (await fetch(u, { headers: key ? { Authorization: `Bearer ${key}` } : {} })).json() };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const heap = async () => { await sleep(200); global.gc(); global.gc(); return process.memoryUsage().heapUsed / 1e6; };
console.log(`start heap ${(await heap()).toFixed(0)} MB`);
let n = 0;
for (const step of [10, 40, 50, 100]) {
  for (let i = 0; i < step; i++) { await mod.render(p, { seed }); n++; if (process.env.YIELD) await sleep(Number(process.env.YIELD)); }
  console.log(`after ${n} renders: heap ${(await heap()).toFixed(0)} MB`);
}
if (process.env.SNAP) console.log('snapshot', v8.writeHeapSnapshot('/tmp/ssr1689/leak.heapsnapshot'));
