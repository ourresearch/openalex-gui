// oxjob #1689 record-ssr: concurrency and render-time checks for server-rendered
// record pages.
//
//   node scripts/record-ssr/concurrency.mjs http://localhost:5389 [parallel=90] [timingN=20]
//
// 1. Picks real ids across record types from the API (with $OPENALEX_API_KEY).
// 2. Fires `parallel` requests at once, mixed types and ids (each id 2-3 times, cold
//    and warm), and checks every response is the page it asked for: status 200,
//    rendered on the server, <title> = that record's name, and the Nuxt payload holds
//    that record and no other.
// 3. Render time per page type: N sequential requests per sample page (warm API cache,
//    so it measures the render) -> p50/p95 ms.
const [base, parArg, nArg] = process.argv.slice(2)
if (!base) { console.error('usage: concurrency.mjs BASE [parallel] [timingN]'); process.exit(2) }
const PARALLEL = Number(parArg) || 90
const N = Number(nArg) || 20
const KEY = process.env.OPENALEX_API_KEY
const H = KEY ? { Authorization: `Bearer ${KEY}` } : {}
const req = { headers: { 'X-Forwarded-Proto': 'https' }, redirect: 'manual' }

const SAMPLES = {
  works: 'works?filter=publication_year:2020&sort=cited_by_count:desc&per_page=4',
  authors: 'authors?sort=cited_by_count:desc&per_page=4',
  sources: 'sources?sort=cited_by_count:desc&per_page=3',
  institutions: 'institutions?sort=cited_by_count:desc&per_page=3',
  topics: 'topics?sort=cited_by_count:desc&per_page=3',
  funders: 'funders?sort=cited_by_count:desc&per_page=2',
  publishers: 'publishers?sort=cited_by_count:desc&per_page=2',
  keywords: 'keywords?sort=cited_by_count:desc&per_page=2',
  concepts: 'concepts?sort=cited_by_count:desc&per_page=2',
  awards: 'awards?per_page=2',
  countries: 'countries?per_page=2',
  fields: 'fields?per_page=2',
  sdgs: 'sdgs?per_page=2',
  licenses: 'licenses?per_page=2',
}
const NATIVE = /^https:\/\/openalex\.org\/([WASIPFCTG]\d+)$/
const typeOf = { W: 'works', A: 'authors', S: 'sources', I: 'institutions', P: 'publishers', F: 'funders', C: 'concepts', T: 'topics', G: 'awards' }
const pagePath = (id) => {
  const m = NATIVE.exec(id)
  return m ? `/${typeOf[m[1][0]]}/${m[1]}` : id.replace('https://openalex.org', '')
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const records = []
for (const [type, q] of Object.entries(SAMPLES)) {
  const r = await (await fetch(`https://api.openalex.org/${q}${q.includes('?') ? '&' : '?'}select=id,display_name`, { headers: H })).json()
  for (const x of r.results || []) records.push({ type, path: pagePath(x.id), name: x.display_name })
}
console.log(`${records.length} records across ${Object.keys(SAMPLES).length} types`)

function verify(rec, res, html) {
  const problems = []
  if (res.status !== 200) problems.push(`status ${res.status}`)
  const render = res.headers.get('x-openalex-render') || ''
  if (!render.startsWith('ssr')) problems.push(`render "${render}"`)
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''
  // The head collapses runs of whitespace in names (src/seo/recordHead.mjs plain()).
  const name = rec.name ? rec.name.replace(/\s+/g, ' ').trim() : rec.name
  if (name && !title.startsWith(esc(name).slice(0, 40)) && !title.startsWith(name.slice(0, 40))) problems.push(`title "${title.slice(0, 60)}" != "${rec.name.slice(0, 60)}"`)
  // devalue writes "/" as \u002F inside the payload JSON.
  const keys = [...html.matchAll(/"entity:([a-z-]+(?:\/|\\u002F)[^"]+)"/g)].map((m) => m[1].replace('\\u002F', '/'))
  const want = rec.path.slice(1)
  if (!keys.includes(want)) problems.push(`payload lacks entity:${want}`)
  const others = keys.filter((k) => k !== want)
  if (others.length) problems.push(`payload has other records: ${others.join(',')}`)
  for (const other of records) {
    const k = other.path.slice(1)
    if (other.path !== rec.path && (html.includes(`"entity:${k}"`) || html.includes(`"entity:${k.replace('/', '\\u002F')}"`))) problems.push(`leak of ${other.path}`)
  }
  return problems
}

// 1b. Warm the server's API cache (sequentially, under the API's 50 requests/s per
// key), so the burst below measures render isolation, not the API's rate limit.
for (const rec of records) await fetch(base + rec.path, req).then((r) => r.text()).catch(() => {})

// 2. Concurrency.
const batch = Array.from({ length: PARALLEL }, (_, i) => records[i % records.length]).sort(() => Math.random() - 0.5)
const t0 = Date.now()
const results = await Promise.all(batch.map(async (rec) => {
  const s = Date.now()
  try {
    const res = await fetch(base + rec.path, req)
    const html = await res.text()
    return { rec, ms: Date.now() - s, bytes: html.length, problems: verify(rec, res, html) }
  } catch (e) {
    return { rec, ms: Date.now() - s, problems: [`fetch failed: ${e} ${e?.cause?.code || e?.cause || ''}`] }
  }
}))
// A record the API was too slow for / rate-limited on gets the SPA shell on purpose:
// counted apart from wrong pages.
const fellBack = results.filter((r) => r.problems.some((p) => p.startsWith('render "spa')))
const wrong = results.filter((r) => r.problems.length && !fellBack.includes(r))
const lat = results.map((r) => r.ms).sort((a, b) => a - b)
const pct = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))]
console.log(`\nconcurrency: ${results.length} parallel requests over ${records.length} records in ${Date.now() - t0} ms; wrong pages: ${wrong.length}; SPA fallbacks: ${fellBack.length}; latency p50 ${pct(lat, 0.5)} ms, p95 ${pct(lat, 0.95)} ms, max ${lat.at(-1)} ms`)
for (const w of wrong.slice(0, 20)) console.log('  WRONG', w.rec.path, w.problems.join('; '))

// 3. Render time per type (sequential, warm).
console.log(`\nrender time per page type (${N} sequential warm requests each; ms):`)
console.log('type'.padEnd(14), 'page'.padEnd(34), 'p50', 'p95', 'KB')
const seen = new Set()
for (const rec of records) {
  if (seen.has(rec.type)) continue
  seen.add(rec.type)
  await fetch(base + rec.path, req).then((r) => r.text())
  const ts = []
  let bytes = 0
  for (let i = 0; i < N; i++) {
    const s = performance.now()
    const html = await fetch(base + rec.path, req).then((r) => r.text())
    ts.push(performance.now() - s)
    bytes = html.length
  }
  ts.sort((a, b) => a - b)
  console.log(rec.type.padEnd(14), rec.path.slice(0, 33).padEnd(34), pct(ts, 0.5).toFixed(0).padStart(3), pct(ts, 0.95).toFixed(0).padStart(3), (bytes / 1024).toFixed(0))
}
process.exit(wrong.length ? 1 : 0)
