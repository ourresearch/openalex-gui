// oxjob #1689 record-ssr: hydration sweep over server-rendered record pages.
//
// Opens each URL in headless Chrome (CDP over the DevTools WebSocket; no extra
// dependency) at each width, logged out and as a returning logged-in visitor (real
// token of the non-admin test account + its cached /users/me in localStorage, set
// before any page script runs), and counts Vue hydration-mismatch messages in the
// console. Also checks the server HTML was SSR (x-openalex-render) and that the
// page is interactive after hydration.
//
//   node scripts/record-ssr/hydration.mjs http://localhost:5389 urls.txt [out.json]
// env: OPENALEX_TEST_VIEWER_API_KEY (logged-in runs; skipped when unset),
//      WIDTHS=1280,400  CONCURRENCY=3  CHROME=/path/to/chrome
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [base, urlFile, outFile] = process.argv.slice(2)
if (!base || !urlFile) { console.error('usage: hydration.mjs BASE urls.txt [out.json]'); process.exit(2) }
const urls = readFileSync(urlFile, 'utf8').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'))
const widths = (process.env.WIDTHS || '1280,400').split(',').map(Number)
const concurrency = Number(process.env.CONCURRENCY) || 3
const chromePath = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewerKey = process.env.OPENALEX_TEST_VIEWER_API_KEY
const PORT = 9300 + Math.floor(Math.random() * 500)

let cachedMe = null
if (viewerKey) {
  const r = await fetch('https://user.openalex.org/users/me', { headers: { Authorization: `Bearer ${viewerKey}` } })
  if (r.ok) {
    cachedMe = await r.json()
    for (const k of ['api_key', 'retired_api_key', 'exports', 'notes']) delete cachedMe[k]
  } else console.error('test viewer /users/me failed', r.status)
}

const profile = mkdtempSync(join(tmpdir(), 'rs-chrome-'))
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
  '--disable-background-networking', 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function browserWs() {
  for (let i = 0; i < 50; i++) {
    try { return (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl } catch { await sleep(200) }
  }
  throw new Error('chrome did not start')
}

// Minimal CDP client: one WebSocket to the browser, sessions per page (flatten).
const ws = new WebSocket(await browserWs())
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
let nextId = 1
const pending = new Map()
const listeners = new Map() // sessionId -> fn(method, params)
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  } else if (msg.method && msg.sessionId && listeners.has(msg.sessionId)) listeners.get(msg.sessionId)(msg.method, msg.params)
}
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = nextId++
  pending.set(id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
})

const MISMATCH = /hydrat|mismatch/i

async function check(path, width, loggedIn) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const messages = []
  let renderHeader = null, status = null, loaded = false
  const docUrl = base + path
  listeners.set(sessionId, (method, p) => {
    if (method === 'Runtime.consoleAPICalled') messages.push({ type: p.type, text: p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 500) })
    else if (method === 'Runtime.exceptionThrown') messages.push({ type: 'exception', text: (p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 500) })
    else if (method === 'Log.entryAdded') messages.push({ type: `log-${p.entry.level}`, text: p.entry.text.slice(0, 500) })
    else if (method === 'Network.responseReceived' && p.type === 'Document' && status === null) {
      status = p.response.status
      renderHeader = p.response.headers['x-openalex-render'] || p.response.headers['X-Openalex-Render'] || null
    } else if (method === 'Page.loadEventFired') loaded = true
    else if (method === 'Fetch.requestPaused') {
      // The local production server 301s to https unless X-Forwarded-Proto says https;
      // add it to requests for the local server only (cross-origin API calls would fail CORS).
      const headers = Object.entries(p.request.headers).map(([name, value]) => ({ name, value }))
      headers.push({ name: 'X-Forwarded-Proto', value: 'https' })
      send('Fetch.continueRequest', { requestId: p.requestId, headers }, sessionId).catch(() => {})
    }
  })
  const s = (m, p) => send(m, p, sessionId)
  await Promise.all([s('Runtime.enable'), s('Log.enable'), s('Network.enable'), s('Page.enable')])
  await s('Fetch.enable', { patterns: [{ urlPattern: `${base}/*` }] })
  await s('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 })
  // Same origin for every page, so clear storage first; then set the login before scripts run.
  const setup = loggedIn && cachedMe
    ? `localStorage.clear(); localStorage.setItem('token', ${JSON.stringify(viewerKey)}); localStorage.setItem('userCache', ${JSON.stringify(JSON.stringify({ token: viewerKey, me: cachedMe }))});`
    : 'try { localStorage.clear() } catch (e) {}'
  await s('Page.addScriptToEvaluateOnNewDocument', { source: setup })
  const t0 = Date.now()
  await s('Page.navigate', { url: docUrl })
  while (!loaded && Date.now() - t0 < 20000) await sleep(100)
  await sleep(2500) // hydration, deferred user boot, post-hydration fetches
  const { result } = await s('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const app = document.getElementById('app');
      return {
        url: location.pathname + location.search,
        title: document.title,
        vueMounted: !!(app && app.__vue_app__),
        entityPage: !!document.querySelector('.entity-page'),
        notFound: /Page not found/.test(document.body.innerText),
        loggedInUi: !document.querySelector('a[href="/login"]'),
        worksRows: document.querySelectorAll('.result-item').length,
      };
    })()`,
  })
  listeners.delete(sessionId)
  await send('Target.closeTarget', { targetId })
  const mismatches = messages.filter((m) => MISMATCH.test(m.text))
  const errors = messages.filter((m) => (m.type === 'error' || m.type === 'exception' || m.type === 'log-error') && !MISMATCH.test(m.text))
  return { path, width, loggedIn, status, renderHeader, ms: Date.now() - t0, ...result.value, mismatches, errors }
}

const jobs = []
for (const path of urls) for (const width of widths) for (const loggedIn of (cachedMe ? [false, true] : [false])) jobs.push([path, width, loggedIn])
const results = []
let i = 0
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (i < jobs.length) {
    const job = jobs[i++]
    try { results.push(await check(...job)) } catch (e) { results.push({ path: job[0], width: job[1], loggedIn: job[2], failed: String(e) }) }
    const r = results.at(-1)
    console.log([r.path, r.width, r.loggedIn ? 'in' : 'out', r.status, r.renderHeader, `mismatch=${r.mismatches?.length}`, `errors=${r.errors?.length}`, `rows=${r.worksRows}`, r.vueMounted ? 'mounted' : 'NOT-MOUNTED', r.loggedIn ? (r.loggedInUi ? 'ui=in' : 'ui=OUT') : '', r.failed || ''].join(' '))
  }
}))
ws.close(); chrome.kill()
await sleep(500)
try { rmSync(profile, { recursive: true, force: true }) } catch {}
const total = results.reduce((n, r) => n + (r.mismatches?.length || 0), 0)
console.log(`\n${results.length} page loads, ${total} hydration-mismatch messages, ${results.filter((r) => r.failed || !r.vueMounted).length} failed/unmounted`)
if (outFile) writeFileSync(outFile, JSON.stringify(results, null, 1))
process.exit(0)
