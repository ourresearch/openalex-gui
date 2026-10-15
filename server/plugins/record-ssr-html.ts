import { defineNitroPlugin } from 'nitropack/runtime'
import { getResponseHeader } from 'h3'
// oxjob #1689: trim the head of server-rendered record pages (the author page was
// 140 KB before this; target under ~120 KB).
//  - Nuxt adds a <link rel="prefetch"> for every lazy chunk the app has (~170 links,
//    ~13 KB: admin, settings, OQL builder...). A record page needs none of them up
//    front; the browser still loads each chunk when it's navigated to.
//  - Vuetify's theme stylesheet is pretty-printed (~26 KB); whitespace-collapsed it is
//    ~5 KB smaller. Vuetify rewrites it in the browser on hydration anyway.
// Only touches responses the record middleware marked as server-rendered.

const PREFETCH_LINK = /<link rel="prefetch"[^>]*>/g
const THEME_STYLE = /(<style id="vuetify-theme-stylesheet"[^>]*>)([\s\S]*?)(<\/style>)/

export function minifyThemeCss(css: string) {
  return css.replace(/\s*\n\s*/g, '').replace(/\s*([{};,])\s*/g, '$1')
}

export function trimRecordHead(chunk: string) {
  return chunk
    .replace(PREFETCH_LINK, '')
    .replace(THEME_STYLE, (_m, open, css, close) => open + minifyThemeCss(css) + close)
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    if (!String(getResponseHeader(event, 'x-openalex-render') || '').startsWith('ssr')) return
    html.head = html.head.map(trimRecordHead)
  })
})
