// oxjob #1689 build-qa: what Heroku and the QA harness rely on (plans/DEPLOY.md).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '../..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const { routes } = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8'))

describe('Heroku deploy contract', () => {
  it('builds with Nuxt and serves the Nitro output on $PORT', () => {
    expect(pkg.scripts.build).toMatch(/\bnuxt build\b/)
    expect(pkg.scripts.start).toBe('node .output/server/index.mjs')
    const procfile = fs.readFileSync(path.join(root, 'Procfile'), 'utf8')
    // The V8 heap cap keeps one SSR process inside a Standard-2X dyno (1 GB) under a crawler
    // burst (record-ssr: 1.1-1.4 GB RSS uncapped; 329 MB at a 384 MB cap).
    expect(procfile).toMatch(/^web: NODE_OPTIONS=--max-old-space-size=(\d+) node \.output\/server\/index\.mjs\s*$/m)
    const heapMb = Number(/max-old-space-size=(\d+)/.exec(procfile)[1])
    expect(heapMb).toBeGreaterThanOrEqual(384)
    expect(heapMb).toBeLessThanOrEqual(640)
  })
  it('pins Node 24 and npm 11 (npm 10 crashes installing Nuxt 4.5)', () => {
    expect(pkg.engines.node).toBe('24.x')
    expect(pkg.engines.npm).toBe('11.x')
  })
  it('keeps the test script', () => {
    expect(pkg.scripts.test).toBe('vitest')
  })
  it('has no Vue CLI entry points left', () => {
    for (const f of ['vue.config.js', 'webpack.config.js', 'server.js']) expect(fs.existsSync(path.join(root, f))).toBe(false)
    expect(Object.values(pkg.scripts).join(' ')).not.toMatch(/vue-cli-service/)
  })
})

describe('QA route list', () => {
  it('has unique ids and site-relative paths', () => {
    const ids = routes.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of routes) expect(r.path.startsWith('/')).toBe(true)
  })
  it('covers every route class', () => {
    const classes = new Set(routes.map(r => r.class))
    for (const c of ['home', 'company', 'list', 'oql', 'record', 'record-short', 'missing', 'auth', 'settings', 'collections', 'admin', 'missing-file']) {
      expect(classes.has(c), c).toBe(true)
    }
  })
  it('never screenshots an API key or other people\'s data', () => {
    for (const r of routes) {
      expect(r.path).not.toMatch(/api-key|api_key/)
      if (r.auth) expect(r.path.startsWith('/admin')).toBe(false)
    }
  })
})
