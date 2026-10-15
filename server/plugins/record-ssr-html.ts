import { defineNitroPlugin } from 'nitropack/runtime'
import { getResponseHeader } from 'h3'
import { stripNeedsJsNote, trimRecordHead } from '../lib/recordHtml'
// oxjob #1689: trim the HTML of server-rendered record pages (the author page was
// 140 KB before this; target under ~120 KB): prefetch links, theme CSS whitespace,
// and the shell's "needs JavaScript" <noscript> note. Details in server/lib/recordHtml.ts.
// Only touches responses the record middleware marked as server-rendered.

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    if (!String(getResponseHeader(event, 'x-openalex-render') || '').startsWith('ssr')) return
    html.head = html.head.map(trimRecordHead)
    html.bodyPrepend = html.bodyPrepend.map(stripNeedsJsNote)
  })
})
