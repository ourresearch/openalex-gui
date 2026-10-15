// oxjob #1689 Nuxt trial: port of #1486. Company pages stay client-rendered, so
// their shell gets the page's own head (title, description, canonical, Open
// Graph) from the same map App.vue uses, swapped in for the generic <title>.
import { defineNitroPlugin } from 'nitropack/runtime'
import { createServerHead } from 'unhead'
import { renderSSRHead } from '@unhead/ssr'
import { COMPANY_PAGES, companyPageHead } from '../../src/companyPages.mjs'

const SHELL_TITLE = /<title>[^<]*<\/title>/
const tagsByPath = new Map<string, string>()
const ready = (async () => {
  for (const path of Object.keys(COMPANY_PAGES)) {
    const head = createServerHead()
    head.push(companyPageHead(path))
    const { headTags } = await renderSSRHead(head)
    tagsByPath.set(path, headTags)
  }
})().catch((err) => console.error('Company page heads not rendered.', err))

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', async (html, { event }) => {
    await ready
    const p = event.path.split('?')[0]
    const tags = tagsByPath.get(p.length > 1 ? p.replace(/\/+$/, '') : p)
    if (!tags) return
    html.head = html.head.map((chunk) => chunk.replace(SHELL_TITLE, () => tags))
  })
})
