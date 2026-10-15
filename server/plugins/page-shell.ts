// oxjob #1689 parity: company-page heads (#1486) and the boot skeleton (#860) in
// the HTML of client-rendered pages, as master's server.js and index.html had them.
import { defineNitroPlugin } from 'nitropack/runtime'
import { createShellRenderer } from '../lib/page-shell'

export default defineNitroPlugin((nitroApp) => {
  const applyShell = createShellRenderer()
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    applyShell(html, event.path)
  })
})
