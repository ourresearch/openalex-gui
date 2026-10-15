// oxjob #1689 Nuxt trial: port of server.js #1688 assistant pages (verified AI
// assistants get a plain page built from the API; anything else falls through).
import { defineEventHandler, getRequestHeader, setResponseHeaders, setResponseStatus } from 'h3'
import { assistantPage } from '../../assistantPages/index.mjs'

export default defineEventHandler(async (event) => {
  const token = process.env.VERIFIED_ASSISTANT_TOKEN
  if (!token || !getRequestHeader(event, 'x-openalex-verified-assistant')) return
  let page = null
  try {
    page = await assistantPage(
      { method: event.method, url: new URL('https://openalex.org' + event.path), header: (name: string) => getRequestHeader(event, name.toLowerCase()) },
      { VERIFIED_ASSISTANT_TOKEN: token, ASSISTANT_PAGES_API_KEY: process.env.ASSISTANT_PAGES_API_KEY },
    )
  } catch (err) {
    console.error('Assistant page failed; serving the site instead.', err)
  }
  if (!page) return
  setResponseStatus(event, page.status)
  setResponseHeaders(event, page.headers)
  return page.body
})
