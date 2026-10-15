// oxjob #1689 Nuxt trial: path rules from server.js, plus a server-side 301 for
// short record ids (/W123 -> /works/W123; the SPA did this client-side).
import { defineEventHandler, sendRedirect, setResponseStatus, setResponseHeader } from 'h3'

// A missing file is a 404, not the app (oxjob #1486). /_nuxt/ is Nuxt's asset dir.
const MISSING_FILE = /^\/((_nuxt|js|css|fonts|img)\/|(brand-assets\/)?[^/]+\.\w+$)/i
const SHORT_ID = /^\/([waspfictg])(\d+)\/?$/i
const TYPES: Record<string, string> = { w: 'works', a: 'authors', s: 'sources', p: 'publishers', f: 'funders', i: 'institutions', c: 'concepts', t: 'topics', g: 'awards' }

export default defineEventHandler((event) => {
  const path = event.path.split('?')[0]
  const qs = event.path.includes('?') ? event.path.slice(event.path.indexOf('?')) : ''
  if (path === '/aboutness') return sendRedirect(event, '/aboutness/viewer', 302)
  const m = SHORT_ID.exec(path)
  if (m) return sendRedirect(event, `/${TYPES[m[1].toLowerCase()]}/${m[1].toUpperCase()}${m[2]}${qs}`, 301)
  // Public files were already served by Nitro's static handler before this runs,
  // so a file-looking path that reaches here does not exist.
  if (MISSING_FILE.test(path)) {
    setResponseStatus(event, 404)
    setResponseHeader(event, 'content-type', 'text/plain')
    return 'Not found'
  }
})
