// oxjob #1689 Nuxt trial: port of server.js analytics./alpha. redirects.
import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const sub = url.hostname.split('.').slice(0, -2)
  if (sub.includes('analytics') && url.pathname === '/') return sendRedirect(event, 'https://openalex.org/analytics', 302)
  if (sub.includes('analytics') || sub.includes('alpha')) return sendRedirect(event, 'https://openalex.org' + url.pathname + url.search, 302)
})
