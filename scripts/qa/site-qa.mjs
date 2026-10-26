#!/usr/bin/env node
// oxjob #1689 whole-site QA: load every route class of openalex.org in headless Chrome
// against two targets (default: today's production origin and a local build of the
// branch) and report, per route: HTTP status, console errors, failed requests, key
// landmarks, Vue hydration warnings, what the raw (no-JS) HTML carries, and screenshots
// at 1280 and 400 px side by side.
//
//   npm run build && PORT=5391 node .output/server/index.mjs &      # the branch, locally
//   node scripts/qa/site-qa.mjs                                      # prod origin vs localhost:5391
//   node scripts/qa/site-qa.mjs --targets branch=http://localhost:5391 --only work,author
//
// Options: --targets name=url[,name=url]  --routes file.json  --widths 1280,400  --keyless
//          --only id[,id]  --rereport <run dir> (redo composites and report.md only)  --out dir (default ~/ox/oxdata/search-engines-see-record-pages/qa/<CT timestamp>)
// Needs playwright-core (`npm --prefix scripts/qa install`) and Google Chrome (CHROME_PATH).
// Requests to a localhost target carry X-Forwarded-Proto: https (the server's SSL redirect
// answers 301 otherwise). Plausible and Sentry ingest are blocked so QA runs don't count
// as visits or errors. Viewer routes log in with $OPENALEX_TEST_VIEWER_API_KEY. Browser calls
// to api.openalex.org carry $QA_API_KEY or $OPENALEX_API_KEY (see apiKey below); start a local
// server with NUXT_SSR_API_KEY set so its own server-side calls carry one too.
// Production: read-only GETs, one page at a time, ~2 loads per route. Not a crawl.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

function loadPlaywright() {
  const candidates = [
    path.join(here, 'node_modules', 'playwright-core'),
    process.env.QA_PLAYWRIGHT_CORE,
    path.join(os.homedir(), 'ox/openalex-gui-1689-nuxt/.trial-tools/node_modules/playwright-core'),
  ].filter(Boolean)
  for (const c of candidates) {
    if (fs.existsSync(c)) return createRequire(import.meta.url)(c)
  }
  throw new Error('playwright-core not found: run `npm --prefix scripts/qa install` or set QA_PLAYWRIGHT_CORE')
}

function parseArgs(argv) {
  const a = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) a[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
  }
  return a
}

function ctStamp() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map(x => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}CT`
}

const args = parseArgs(process.argv.slice(2))
let targets = (args.targets || 'prod=https://openalex-gui.herokuapp.com,branch=http://localhost:5391')
  .split(',').map(s => { const [name, ...u] = s.split('='); return { name, base: u.join('=').replace(/\/$/, '') } })
let widths = String(args.widths || '1280,400').split(',').map(Number)
const routeFile = args.routes || path.join(here, 'routes.json')
let routes = JSON.parse(fs.readFileSync(routeFile, 'utf8')).routes
if (args.only) { const only = new Set(String(args.only).split(',')); routes = routes.filter(r => only.has(r.id)) }
let outDir = args.rereport || args.out || path.join(os.homedir(), 'ox/oxdata/search-engines-see-record-pages/qa', ctStamp())
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewerKey = process.env.OPENALEX_TEST_VIEWER_API_KEY
// Logged-out pages call api.openalex.org with no key, which spends the free budget of the
// machine's IP ($0.10/day, shared by every desk session) and then answers 429 to every page.
// So the harness adds a key to those calls at the network layer (the page still runs logged
// out). --keyless turns this off.
const apiKey = args.keyless ? null : (process.env.QA_API_KEY || process.env.OPENALEX_API_KEY || null)
// oxjob #1782: with ORIGIN_KEY_MODE=enforce, openalex-gui.herokuapp.com 301s to openalex.org unless the
// request carries the origin key (server/lib/origin-key.ts). The harness sends it only to the target
// under test, never to third parties: OPENALEX_SITE_ORIGIN_KEY="$(heroku config:get ORIGIN_SHARED_SECRET -a openalex-gui | cut -d, -f1)"
const originKey = (process.env.OPENALEX_SITE_ORIGIN_KEY || '').trim() || null
const BLOCK = /(^https?:\/\/(plausible\.io|[^/]*\.ingest\.(us\.)?sentry\.io)\/)/
const isLocal = base => /^http:\/\/(localhost|127\.0\.0\.1)/.test(base)
fs.mkdirSync(outDir, { recursive: true })
if (!originKey && targets.some(t => /\.herokuapp\.com$/.test(new URL(t.base).host))) {
  console.warn('note: no OPENALEX_SITE_ORIGIN_KEY; a herokuapp.com target redirects to openalex.org while ORIGIN_KEY_MODE=enforce')
}

// Desk memory guard: desk's RAM is shared by ~20 Claude sessions. A page that runs away
// (one SERP grew a renderer to 2.8 GB in the first run) gets its renderer killed once it
// passes QA_RENDERER_MB, and the route is reported as such. Pages also get a hard time budget.
const RENDERER_MB = Number(process.env.QA_RENDERER_MB || 1000)
const PAGE_BUDGET_MS = Number(process.env.QA_PAGE_BUDGET_MS || 60000)
const guardKills = []
let browserPid = null
function guardTick() {
  let lines
  try { lines = execFileSync('ps', ['-axo', 'pid=,ppid=,rss=,command='], { encoding: 'utf8', maxBuffer: 16e6 }).split('\n') } catch { return }
  if (!browserPid) {
    const own = lines.find(l => l.includes(`--qa-run=${process.pid}`) && !l.includes('Helper'))
    if (own) browserPid = Number(own.trim().split(/\s+/)[0])
    if (!browserPid) return
  }
  for (const l of lines) {
    const [pid, ppid, rss] = l.trim().split(/\s+/).map(Number)
    if (ppid === browserPid && rss / 1024 > RENDERER_MB) {
      try { process.kill(pid, 'SIGKILL'); guardKills.push({ pid, mb: Math.round(rss / 1024), at: Date.now() }) } catch {}
    }
  }
}

// What a crawler that doesn't run JavaScript gets: status, redirect, title, canonical,
// description, <h1> and the route's text in the raw HTML.
async function rawCheck(target, route) {
  const headers = { 'user-agent': 'OpenAlex-QA/1689 (+https://openalex.org)' }
  if (isLocal(target.base)) headers['x-forwarded-proto'] = 'https'
  else if (originKey) headers['x-openalex-origin-key'] = originKey
  const r = { status: null, location: null, bytes: 0 }
  try {
    const res = await fetch(target.base + route.path, { headers, redirect: 'manual' })
    r.status = res.status
    r.location = res.headers.get('location')
    r.cacheControl = res.headers.get('cache-control')
    r.contentType = res.headers.get('content-type')
    const html = await res.text()
    r.bytes = html.length
    const m = (re) => (html.match(re) || [])[1] || null
    r.title = m(/<title[^>]*>([^<]*)<\/title>/i)
    r.canonical = m(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || m(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i)
    r.description = m(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
    // Rendered markup only: drop the head and every <script> (Nuxt's payload carries the
    // record's JSON, which is not the same as the page showing it).
    const body = html.slice(Math.max(0, html.search(/<body[\s>]/i))).replace(/<script\b[\s\S]*?<\/script>/gi, '')
    r.h1 = /<h1[\s>]/i.test(body)
    r.textInHtml = route.text ? body.includes(route.text) : null
    r.appHtmlBytes = (() => { const i = html.indexOf('id="app"'); if (i < 0) return 0; const j = html.indexOf('</div>', i); return j - i })()
  } catch (e) { r.error = String(e).slice(0, 200) }
  return r
}

async function loadInBrowser(browser, target, route, width) {
  const killsBefore = guardKills.length
  let timer
  const budget = new Promise(res => { timer = setTimeout(() => res('budget'), PAGE_BUDGET_MS) })
  const work = loadInBrowserInner(browser, target, route, width)
  const r = await Promise.race([work.catch(e => ({ crashed: String(e.message || e).slice(0, 200) })), budget])
  clearTimeout(timer)
  const kills = guardKills.slice(killsBefore)
  const base = { status: null, finalUrl: null, redirects: [], loadMs: null, landmarkFound: false, dom: {}, consoleErrors: [], consoleWarnings: [], pageErrors: [], failed: [], hydration: [], shot: null }
  if (r === 'budget') {
    work.then(x => x?.ctx?.close().catch(() => {}), () => {})
    return { ...base, pageErrors: [`QA: page exceeded its ${PAGE_BUDGET_MS / 1000} s budget` + (kills.length ? `; renderer killed at ${kills[0].mb} MB` : '')] }
  }
  if (r.crashed) return { ...base, pageErrors: ['QA: ' + r.crashed + (kills.length ? `; renderer killed by the memory guard at ${kills[0].mb} MB` : '')] }
  delete r.ctx
  if (kills.length) r.pageErrors.push(`QA: renderer killed by the memory guard at ${kills[0].mb} MB`)
  return r
}

async function loadInBrowserInner(browser, target, route, width) {
  const height = width >= 1000 ? 900 : 860
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  if (route.auth === 'viewer' && viewerKey) {
    await ctx.addInitScript(k => { try { localStorage.setItem('token', k) } catch (e) {} }, viewerKey)
  }
  await ctx.route('**/*', (rt) => {
    const u = rt.request().url()
    if (BLOCK.test(u)) return rt.abort('blockedbyclient')
    if (apiKey && u.startsWith('https://api.openalex.org/') && !rt.request().headers()['authorization']) {
      return rt.continue({ headers: { ...rt.request().headers(), authorization: `Bearer ${apiKey}` } })
    }
    if (isLocal(target.base) && u.startsWith(target.base)) {
      return rt.continue({ headers: { ...rt.request().headers(), 'x-forwarded-proto': 'https' } })
    }
    if (originKey && !isLocal(target.base) && u.startsWith(target.base + '/')) {
      return rt.continue({ headers: { ...rt.request().headers(), 'x-openalex-origin-key': originKey } })
    }
    return rt.continue()
  })
  const page = await ctx.newPage()
  const consoleErrors = [], consoleWarnings = [], pageErrors = [], failed = [], hydration = []
  page.on('console', m => {
    const t = m.text().replace(/\s+/g, ' ').slice(0, 300)
    if (/hydrat/i.test(t)) hydration.push(`${m.type()}: ${t}`)
    // "Failed to load resource" repeats a failed request, which is counted on its own.
    if (m.type() === 'error' && !/^Failed to load resource/.test(t)) consoleErrors.push(t)
    else if (m.type() === 'warning') consoleWarnings.push(t)
  })
  page.on('pageerror', e => pageErrors.push(String(e).replace(/\s+/g, ' ').slice(0, 300)))
  page.on('crash', () => pageErrors.push('QA: renderer crashed'))
  page.on('requestfailed', rq => {
    const f = rq.failure()?.errorText || ''
    if (BLOCK.test(rq.url())) return
    failed.push(`${f} ${rq.method()} ${rq.url().slice(0, 160)}`)
  })
  page.on('response', rs => {
    if (rs.status() >= 400 && rs.request().resourceType() !== 'document') failed.push(`${rs.status()} ${rs.request().method()} ${rs.url().slice(0, 160)}`)
  })
  const t0 = Date.now()
  let status = null, finalUrl = null, redirects = []
  try {
    const resp = await page.goto(target.base + route.path, { waitUntil: 'load', timeout: 45000 })
    status = resp?.status() ?? null
    let rq = resp?.request()?.redirectedFrom()
    while (rq) { redirects.unshift(rq.url()); rq = rq.redirectedFrom() }
  } catch (e) { pageErrors.push('goto: ' + String(e.message).slice(0, 200)) }
  const loadMs = Date.now() - t0
  let landmarkFound = null
  if (route.landmark) {
    landmarkFound = await page.waitForSelector(route.landmark, { state: 'attached', timeout: 10000 }).then(() => true, () => false)
  }
  if (route.text) await page.waitForFunction(t => document.body && document.body.innerText.includes(t), route.text, { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(1500)
  finalUrl = page.url()
  const dom = await page.evaluate((text) => {
    const app = document.getElementById('app') || document.getElementById('__nuxt')
    const body = document.body ? document.body.innerText : ''
    return {
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim().slice(0, 80)).slice(0, 3),
      appChildren: app ? app.children.length : 0,
      main: !!document.querySelector('main, .v-main'),
      textChars: body.length,
      textFound: text ? body.includes(text) : null,
      nuxtError: !!document.querySelector('.nuxt-error, [data-nuxt-error]') || /^\s*(500|404)\s*\n/.test(body),
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      description: document.querySelector('meta[name="description"]')?.content || null,
    }
  }, route.text || null).catch(e => ({ error: String(e).slice(0, 200) }))
  const shotRel = path.join('shots', target.name, String(width), `${route.id}.png`)
  fs.mkdirSync(path.dirname(path.join(outDir, shotRel)), { recursive: true })
  await page.screenshot({ path: path.join(outDir, shotRel), timeout: 15000 }).catch(e => pageErrors.push('screenshot: ' + String(e.message).slice(0, 120)))
  await ctx.close()
  return { status, finalUrl, redirects, loadMs, landmarkFound, dom, consoleErrors, consoleWarnings, pageErrors, failed: [...new Set(failed)], hydration, shot: shotRel }
}

async function runTarget(browser, target) {
  const out = {}
  for (const route of routes) {
    if (route.auth === 'viewer' && !viewerKey) { out[route.id] = { skipped: 'no OPENALEX_TEST_VIEWER_API_KEY' }; continue }
    const res = { raw: await rawCheck(target, route), widths: {} }
    // A missing file or plain-text route is checked raw only; a browser adds nothing.
    if (route.landmark !== null) {
      for (const w of widths) res.widths[w] = await loadInBrowser(browser, target, route, w)
    }
    out[route.id] = res
    const b = res.widths[widths[0]]
    console.log(`[${target.name}] ${route.id.padEnd(20)} raw ${res.raw.status} ${b ? `browser ${b.status} err ${b.consoleErrors.length + b.pageErrors.length} fail ${b.failed.length} hyd ${b.hydration.length} ${b.loadMs}ms` : ''}`)
  }
  return out
}

// Share of pixels that differ between the first two targets' screenshots, per width
// (grey level differs by more than 40 of 255). 0 = the first screen looks the same.
const pixelDiff = {}
async function diffShots(page, aPath, bPath) {
  const a = 'data:image/png;base64,' + fs.readFileSync(aPath).toString('base64')
  const b = 'data:image/png;base64,' + fs.readFileSync(bPath).toString('base64')
  return page.evaluate(async ([a, b]) => {
    const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src })
    const [A, B] = await Promise.all([load(a), load(b)])
    if (A.width !== B.width || A.height !== B.height) return null
    const px = img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data }
    const pa = px(A), pb = px(B)
    let n = 0
    for (let i = 0; i < pa.length; i += 4) {
      const ga = (pa[i] + pa[i + 1] + pa[i + 2]) / 3, gb = (pb[i] + pb[i + 1] + pb[i + 2]) / 3
      if (Math.abs(ga - gb) > 40) n++
    }
    return Math.round(1000 * n / (pa.length / 4)) / 10
  }, [a, b])
}

// One PNG per route: every target at every width, side by side, labelled.
async function composites(browser, results) {
  const dir = path.join(outDir, 'compare'); fs.mkdirSync(dir, { recursive: true })
  const ctx = await browser.newContext({ viewport: { width: 2400, height: 1000 } })
  const page = await ctx.newPage()
  for (const route of routes) {
    if (route.landmark === null) continue
    if (targets.length >= 2) {
      for (const w of widths) {
        const [ra, rb] = targets.slice(0, 2).map(t => results[t.name]?.[route.id]?.widths?.[w])
        if (ra?.shot && rb?.shot && fs.existsSync(path.join(outDir, ra.shot)) && fs.existsSync(path.join(outDir, rb.shot))) {
          ;(pixelDiff[route.id] ||= {})[w] = await diffShots(page, path.join(outDir, ra.shot), path.join(outDir, rb.shot)).catch(() => null)
        }
      }
    }
    const cells = []
    for (const w of widths) for (const t of targets) {
      const r = results[t.name]?.[route.id]?.widths?.[w]
      if (!r || !r.shot || !fs.existsSync(path.join(outDir, r.shot))) continue
      const src = 'data:image/png;base64,' + fs.readFileSync(path.join(outDir, r.shot)).toString('base64')
      const scale = w >= 1000 ? 0.5 : 1
      cells.push(`<figure><figcaption>${t.name} · ${w}px · ${r.status ?? 'ERR'} · err ${r.consoleErrors.length + r.pageErrors.length} · hyd ${r.hydration.length}</figcaption><img src="${src}" style="width:${Math.round(w * scale)}px"></figure>`)
    }
    if (!cells.length) continue
    await page.setContent(`<html><body style="margin:0;font:13px system-ui;background:#eee"><div style="padding:6px 10px;font-weight:600">${route.id} — ${route.path.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div><div style="display:flex;gap:8px;align-items:flex-start;padding:0 8px 8px">${cells.join('')}</div><style>figure{margin:0;background:#fff;border:1px solid #ccc}figcaption{padding:4px 6px;border-bottom:1px solid #ccc}img{display:block}</style></body></html>`)
    await page.waitForLoadState('load')
    const box = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }))
    await page.setViewportSize({ width: Math.max(800, box.w), height: Math.max(400, box.h) })
    await page.screenshot({ path: path.join(dir, `${route.id}.png`), fullPage: true })
  }
  await ctx.close()
}

const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
// Failed requests to the site itself or to OpenAlex's APIs count; third-party ones
// (Turnstile rejects localhost/herokuapp hostnames, Zendesk, fonts) are listed only.
const isAppRequest = (line, base) => line.includes(base) || /https:\/\/(api|user|content)\.openalex\.org\//.test(line)
function report(results) {
  const [A, B] = targets.map(t => t.name)
  const L = []
  L.push(`# Whole-site QA (#1689) — ${path.basename(outDir)}`, '')
  L.push(`Targets: ${targets.map(t => `**${t.name}** ${t.base}`).join(', ')}. Widths: ${widths.join(', ')} px. Routes: ${routes.length} (\`${path.relative(process.cwd(), routeFile)}\`).`, '')
  L.push('Columns per target: raw = status of the first response with no JavaScript (a crawler\'s view; `301→` shows the redirect), SSR = route text or an `<h1>` already in that raw HTML, then the browser at the first width: status (plus where it ended up, when that differs from the first target), console errors + page errors (most across widths), failed requests to the site or the OpenAlex APIs (4xx/5xx or network errors; third-party failures are listed in the details only), landmark found, Vue hydration warnings (all widths summed), and the share of pixels that differ between the first two targets\' first screens (above 1% is worth a look; animated pages such as home always differ a little). Composite screenshots are in `compare/`.', '')
  const head = ['route', 'class']
  for (const t of targets) head.push(`${t.name} raw`, `${t.name} SSR`, `${t.name} browser`, `${t.name} err`, `${t.name} fail`, `${t.name} landmark`, `${t.name} hyd`)
  if (targets.length >= 2) head.push(`pixels differ (${widths.join(' / ')})`)
  head.push('shot')
  L.push('| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|')
  for (const route of routes) {
    const row = [`\`${route.id}\``, route.class]
    for (const t of targets) {
      const r = results[t.name]?.[route.id]
      if (!r || r.skipped) { row.push('skip', '', '', '', '', '', ''); continue }
      const raw = r.raw.status + (r.raw.location ? `→ ${r.raw.location.replace(t.base, '').slice(0, 40)}` : '')
      const ssr = route.text ? (r.raw.textInHtml ? 'yes' : 'no') : (r.raw.h1 ? 'h1' : 'no')
      const b = r.widths[widths[0]]
      const hyd = Object.values(r.widths).reduce((n, x) => n + x.hydration.length, 0)
      if (!b) { row.push(esc(raw), ssr, '', '', '', '', ''); continue }
      const err = Object.values(r.widths).reduce((n, x) => Math.max(n, x.consoleErrors.length + x.pageErrors.length), 0)
      const fail = Object.values(r.widths).reduce((n, x) => Math.max(n, x.failed.filter(f => isAppRequest(f, t.base)).length), 0)
      const lm = b.landmarkFound === null ? '' : (b.landmarkFound ? 'yes' : '**no**') + (route.text ? (b.dom.textFound ? ', text' : ', **no text**') : '')
      // Where the browser ended up, when that differs from the first target (e.g. bounced to /login).
      const first = results[targets[0].name]?.[route.id]?.widths?.[widths[0]]
      const endPath = x => (x?.finalUrl || '').replace(/^https?:\/\/[^/]+/, '')
      const moved = t !== targets[0] && first && endPath(b) !== endPath(first) ? ` **→ ${esc(endPath(b)).slice(0, 50)}**` : ''
      row.push(esc(raw), ssr, String(b.status ?? 'ERR') + moved, String(err), String(fail), lm, hyd ? `**${hyd}**` : '0')
    }
    if (targets.length >= 2) row.push(pixelDiff[route.id] ? widths.map(w => pixelDiff[route.id][w] == null ? '?' : pixelDiff[route.id][w] + '%').join(' / ') : '')
    row.push(fs.existsSync(path.join(outDir, 'compare', `${route.id}.png`)) ? `[png](compare/${route.id}.png)` : '')
    L.push('| ' + row.join(' | ') + ' |')
  }
  L.push('', '## Details per route', '')
  for (const route of routes) {
    L.push(`### ${route.id} — \`${route.path}\``, '')
    for (const t of targets) {
      const r = results[t.name]?.[route.id]
      if (!r || r.skipped) { L.push(`- **${t.name}**: skipped ${r?.skipped || ''}`); continue }
      L.push(`- **${t.name}** raw: ${r.raw.status}${r.raw.location ? ' → ' + r.raw.location : ''}, ${r.raw.bytes} B, cache-control \`${r.raw.cacheControl ?? '(none)'}\`, title "${esc(r.raw.title)}", canonical ${r.raw.canonical ?? '(none)'}, description ${r.raw.description ? 'yes' : '(none)'}`)
      for (const [w, b] of Object.entries(r.widths)) {
        L.push(`  - ${w}px: ${b.status} in ${b.loadMs} ms, final ${b.finalUrl?.replace(t.base, '')}, title "${esc(b.dom.title)}", h1 ${JSON.stringify(b.dom.h1 || [])}, text ${b.dom.textChars} chars`)
        const show = (label, arr) => { if (arr.length) L.push(`    - ${label} (${arr.length}): ` + [...new Set(arr)].slice(0, 6).map(x => '`' + esc(x).slice(0, 220) + '`').join('; ')) }
        show('hydration', b.hydration); show('page errors', b.pageErrors); show('console errors', b.consoleErrors)
        show('failed requests, site or OpenAlex API', b.failed.filter(f => isAppRequest(f, t.base))); show('failed requests, third-party', b.failed.filter(f => !isAppRequest(f, t.base)))
      }
    }
    L.push('')
  }
  fs.writeFileSync(path.join(outDir, 'report.md'), L.join('\n'))
}

const { chromium } = loadPlaywright()
const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: [`--qa-run=${process.pid}`] })
const guard = setInterval(guardTick, 1000)
let results = {}
try {
  if (args.rereport) {
    // Rebuild composites, pixel diffs and report.md from a finished run's results.json.
    const saved = JSON.parse(fs.readFileSync(path.join(outDir, 'results.json'), 'utf8'))
    ;({ targets, widths, routes, results } = saved)
  } else {
    await Promise.all(targets.map(async t => { results[t.name] = await runTarget(browser, t) }))
  }
  await composites(browser, results)
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify({ targets, widths, routes, results, pixelDiff }, null, 1))
  report(results)
} finally {
  clearInterval(guard)
  await browser.close()
}
console.log('report: ' + path.join(outDir, 'report.md'))
