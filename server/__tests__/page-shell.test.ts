// oxjob #1689 parity: the page-dependent parts of master's index.html on Nuxt's
// HTML (server/lib/page-shell.ts): company-page heads (#1486), boot skeleton (#860).
import { describe, it, expect } from 'vitest'
import { createShellRenderer, pagePath, BOOT_SKELETON } from '../lib/page-shell'
import { COMPANY_PAGES } from '../../src/companyPages.mjs'

const NOSCRIPT = '<noscript><p>OpenAlex needs JavaScript</p></noscript>'
// What Nuxt's renderer hands render:html: head tags as one chunk, body as the app root.
function spaShell() {
  return {
    head: ['<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>OpenAlex</title>\n<link rel="preconnect" href="https://api.openalex.org" crossorigin>'],
    bodyPrepend: [NOSCRIPT],
    body: ['<div id="app"></div>', '<div id="teleports"></div>'],
  }
}
function ssrPage() {
  return {
    head: ['<meta charset="utf-8">\n<title>The state of OA | OpenAlex</title>'],
    bodyPrepend: [NOSCRIPT],
    body: ['<div id="app"><div class="v-application">...</div></div>', '<div id="teleports"></div>'],
  }
}
const applyShell = createShellRenderer()

describe('company page heads (#1486)', () => {
  it.each(Object.keys(COMPANY_PAGES))('%s gets its own title, description, canonical and Open Graph', (p) => {
    const html = spaShell()
    applyShell(html, p)
    const head = html.head.join('')
    expect(head.match(/<title>/g)).toHaveLength(1)
    expect(head).not.toContain('<title>OpenAlex</title>')
    expect(head).toContain('<meta name="description"')
    expect(head).toContain(`<link rel="canonical" href="https://openalex.org${p}">`)
    expect(head).toContain(`<meta property="og:url" content="https://openalex.org${p}">`)
    expect(head).toContain('<meta property="og:image" content="https://openalex.org/brand-assets/openalex-mark-square.png">')
    // The rest of the shell's head is untouched, in place.
    expect(head.startsWith('<meta charset="utf-8">')).toBe(true)
    expect(head).toContain('<link rel="preconnect" href="https://api.openalex.org" crossorigin>')
    // unhead 3's own defaults (charset, viewport) are not added a second time.
    expect(head.match(/<meta charset/g)).toHaveLength(1)
    expect(head.match(/name="viewport"/g)).toHaveLength(1)
  })
  it('matches a trailing slash and ignores the query string, as server.js did', () => {
    const html = spaShell()
    applyShell(html, '/about/?utm_source=x')
    expect(html.head[0]).toContain('<title>About | OpenAlex</title>')
  })
  it('the home page opts out of the title template', () => {
    const html = spaShell()
    applyShell(html, '/')
    expect(html.head[0]).toContain(`<title>${COMPANY_PAGES['/'].title}</title>`)
  })
  it('other client-rendered pages keep the generic shell head', () => {
    const html = spaShell()
    applyShell(html, '/works?search=kelp')
    expect(html.head[0]).toContain('<title>OpenAlex</title>')
    expect(html.head[0]).not.toContain('canonical')
  })
})

describe('shell title', () => {
  it('a client-rendered page with no <title> gets master\'s plain one, after the viewport meta', () => {
    const html = spaShell()
    html.head = [html.head[0].replace('<title>OpenAlex</title>\n', '')]
    applyShell(html, '/works')
    expect(html.head[0]).toBe('<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>OpenAlex</title>\n<link rel="preconnect" href="https://api.openalex.org" crossorigin>')
  })
  it('and a company page then gets its own head in its place', () => {
    const html = spaShell()
    html.head = [html.head[0].replace('<title>OpenAlex</title>\n', '')]
    applyShell(html, '/about')
    expect(html.head[0]).toContain('<title>About | OpenAlex</title>')
    expect(html.head[0].match(/<title>/g)).toHaveLength(1)
  })
})

describe('boot skeleton (#860)', () => {
  it('client-rendered pages get it after the noscript text, before the app root', () => {
    const html = spaShell()
    applyShell(html, '/works')
    expect(html.bodyPrepend).toEqual([NOSCRIPT, BOOT_SKELETON])
    expect(BOOT_SKELETON).toContain('<div id="boot-skeleton" aria-hidden="true"><div><img src="/brand-assets/openalex-lockup.png" alt=""></div></div>')
  })
  it('auth pages (bare chrome) do not', () => {
    for (const p of ['/login', '/signup', '/login/magic-token/abc', '/signup?redirect=/x']) {
      const html = spaShell()
      applyShell(html, p)
      expect(html.bodyPrepend).toEqual([NOSCRIPT])
    }
    const html = spaShell()
    applyShell(html, '/loginx')
    expect(html.bodyPrepend).toContain(BOOT_SKELETON)
  })
})

describe('server-rendered pages', () => {
  it('are left alone: their own head, their real top bar', () => {
    const html = ssrPage()
    const before = JSON.stringify(html)
    applyShell(html, '/works/W2741809807')
    expect(JSON.stringify(html)).toBe(before)
  })
})

describe('pagePath', () => {
  it('strips the query and trailing slashes, keeps /', () => {
    expect(pagePath('/')).toBe('/')
    expect(pagePath('/?x=1')).toBe('/')
    expect(pagePath('/jobs/')).toBe('/jobs')
    expect(pagePath('/jobs//?a=b')).toBe('/jobs')
    expect(pagePath('//')).toBe('/')
  })
})
