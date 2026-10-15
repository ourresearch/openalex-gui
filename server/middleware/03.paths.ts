// oxjob #1689: path rules from server.js. Short record ids (/W123) are 301'd by
// 02.records.ts, which runs first (one hop to the canonical URL, merged ids included).
import { defineEventHandler, sendRedirect, setResponseStatus, setResponseHeader } from 'h3'

// A missing file is a 404, not the app (oxjob #1486). /_nuxt/ is Nuxt's asset dir.
const MISSING_FILE = /^\/((_nuxt|js|css|fonts|img)\/|(brand-assets\/)?[^/]+\.\w+$)/i

export default defineEventHandler((event) => {
  const path = event.path.split('?')[0]
  if (path === '/aboutness') return sendRedirect(event, '/aboutness/viewer', 302)
  // Public files were already served by Nitro's static handler before this runs,
  // so a file-looking path that reaches here does not exist.
  if (MISSING_FILE.test(path)) {
    setResponseStatus(event, 404)
    setResponseHeader(event, 'content-type', 'text/plain')
    return 'Not found'
  }
})
