// oxjob #1689 parity: the parts of master's public/index.html that depend on the
// page, added to the HTML Nuxt sends for client-rendered (SPA) pages.
import { renderCompanyHeadTags, withCompanyHead, SHELL_TITLE } from '../../companyPageHtml.mjs'

// Boot skeleton (oxjob #860), copied from master's public/index.html: a plain-HTML
// copy of the 56px site top bar so a cold visitor sees the site chrome while the
// JS bundle downloads, instead of a white page. Sits outside #app; App.vue removes
// it the moment the real chrome resolves. Keep in sync with .site-top-bar /
// .site-top-bar-inner in SiteTopBar.vue.
export const BOOT_SKELETON = `<style>
  #boot-skeleton { position: absolute; top: 0; left: 0; right: 0; z-index: 1003; background: #fff; border-bottom: 0.5px solid rgba(0, 0, 0, 0.12); }
  #boot-skeleton > div { display: flex; align-items: center; max-width: 1280px; margin: 0 auto; height: 56px; padding: 0 40px; }
  #boot-skeleton img { height: 26px; display: block; }
  @media (max-width: 700px) { #boot-skeleton > div { padding: 0 16px; } }
</style>
<div id="boot-skeleton" aria-hidden="true"><div><img src="/brand-assets/openalex-lockup.png" alt=""></div></div>`

// Auth pages use the 'bare' chrome (no bar). Master dropped the skeleton there
// with an inline script on location.pathname; the server knows the path.
const BARE_PAGES = /^\/(login|signup)(\/|$)/

const SHELL_TITLE_TAG = '<title>OpenAlex</title>'
const VIEWPORT_META = /<meta name="viewport"[^>]*>/

function withShellTitle(head: string): string {
  const m = VIEWPORT_META.exec(head)
  if (!m) return SHELL_TITLE_TAG + head
  const at = m.index + m[0].length
  return head.slice(0, at) + '\n' + SHELL_TITLE_TAG + head.slice(at)
}

// What Nuxt's SPA renderer puts in <body> when the route isn't server-rendered.
const EMPTY_APP_ROOT = /^<div id="app"[^>]*><\/div>$/

// The path a page is looked up by, as server.js did (no query, no trailing slash).
export function pagePath(path: string): string {
  const p = path.split('?')[0]
  return p.length > 1 ? p.replace(/\/+$/, '') || '/' : p
}

export function isSpaShell(body: string[]): boolean {
  return EMPTY_APP_ROOT.test((body[0] || '').trim())
}

type HtmlContext = { head: string[], bodyPrepend: string[], body: string[] }

// Company pages' own head (#1486) and the boot skeleton (#860). Server-rendered
// pages bring their own head and real chrome, so they are left alone.
export function createShellRenderer() {
  let companyHeads = new Map<string, string>()
  try {
    companyHeads = renderCompanyHeadTags()
  } catch (err) {
    // Never keep the site down over this: company pages get the generic shell.
    console.error('Company page heads not rendered; serving the shell for every page.', err)
  }
  return function applyShell(html: HtmlContext, rawPath: string) {
    if (!isSpaShell(html.body)) return
    const path = pagePath(rawPath)
    // Master's shell title (nuxt.config sets none, see there), right after the viewport meta.
    if (!html.head.some(chunk => SHELL_TITLE.test(chunk))) {
      html.head = html.head.map((chunk, i) => (i === 0 ? withShellTitle(chunk) : chunk))
    }
    const tags = companyHeads.get(path)
    if (tags) html.head = html.head.map(chunk => withCompanyHead(chunk, tags))
    if (!BARE_PAGES.test(path)) html.bodyPrepend.push(BOOT_SKELETON)
  }
}
