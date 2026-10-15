// oxjob #1689 Nuxt trial: port of server.js `heroku-ssl-redirect` (301 to https in production).
import { defineEventHandler, getRequestHeader, getRequestURL, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  if (process.env.NODE_ENV !== 'production') return
  if (getRequestHeader(event, 'x-forwarded-proto') === 'https') return
  const url = getRequestURL(event)
  return sendRedirect(event, 'https://' + url.host + url.pathname + url.search, 301)
})
