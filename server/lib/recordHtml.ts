// oxjob #1689: HTML trims for server-rendered record pages (used by
// server/plugins/record-ssr-html.ts; pure, so vitest can load it without Nitro).
//  - Nuxt adds a <link rel="prefetch"> for every lazy chunk the app has (~170 links,
//    ~13 KB: admin, settings, OQL builder...). A record page needs none of them up
//    front; the browser still loads each chunk when it's navigated to.
//  - Vuetify's theme stylesheet is pretty-printed (~26 KB); whitespace-collapsed it is
//    ~5 KB smaller. Vuetify rewrites it in the browser on hydration anyway.
//  - The <noscript> "OpenAlex needs JavaScript to run in your browser" note (app.head
//    in nuxt.config) is for the client-rendered shell. On a server-rendered record
//    page it is false, and it was the first text a non-JS crawler or AI fetcher read,
//    ahead of the record (merge track).

const PREFETCH_LINK = /<link rel="prefetch"[^>]*>/g
const THEME_STYLE = /(<style id="vuetify-theme-stylesheet"[^>]*>)([\s\S]*?)(<\/style>)/
const NEEDS_JS_NOSCRIPT = /<noscript>(?:(?!<\/noscript>)[\s\S])*?needs JavaScript to run(?:(?!<\/noscript>)[\s\S])*<\/noscript>/g

export function minifyThemeCss(css: string) {
  return css.replace(/\s*\n\s*/g, '').replace(/\s*([{};,])\s*/g, '$1')
}

export function trimRecordHead(chunk: string) {
  return chunk
    .replace(PREFETCH_LINK, '')
    .replace(THEME_STYLE, (_m, open, css, close) => open + minifyThemeCss(css) + close)
}

export function stripNeedsJsNote(chunk: string) {
  return chunk.replace(NEEDS_JS_NOSCRIPT, '')
}
