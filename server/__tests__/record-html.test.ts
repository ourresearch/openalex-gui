// oxjob #1689 merge track: HTML trims for server-rendered record pages.
import { describe, it, expect } from 'vitest'
import { minifyThemeCss, stripNeedsJsNote, trimRecordHead } from '../lib/recordHtml'

const NOTE = '<noscript><p><strong>OpenAlex needs JavaScript to run in your browser.</strong></p><p>OpenAlex is a free and open catalog of the world\'s research. <a href="https://help.openalex.org/">help.openalex.org</a></p></noscript>'

describe('record page HTML trims', () => {
  it('drops the shell\'s "needs JavaScript" note, and only that noscript', () => {
    const other = '<noscript><img src="/pixel.gif"></noscript>'
    expect(stripNeedsJsNote(NOTE + '<div id="app">')).toBe('<div id="app">')
    expect(stripNeedsJsNote(other + NOTE)).toBe(other)
    expect(stripNeedsJsNote(other)).toBe(other)
  })
  it('drops prefetch links and collapses the theme CSS', () => {
    const head = '<link rel="prefetch" as="script" href="/_nuxt/a.js"><style id="vuetify-theme-stylesheet">\n  :root {\n    --v-a: 1;\n  }\n</style>'
    expect(trimRecordHead(head)).toBe('<style id="vuetify-theme-stylesheet">:root{--v-a: 1;}</style>')
    expect(minifyThemeCss('a {\n  b: c;\n}')).toBe('a{b: c;}')
  })
})
