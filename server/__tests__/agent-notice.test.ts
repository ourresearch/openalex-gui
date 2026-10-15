// oxjob #1689: the "Notice to agents" on server-rendered record pages. Who gets it
// (server/lib/agentNotice.mjs), how the record middleware passes that to the render
// (event.context.oxRecord.agentNotice), and what the notice renders
// (src/components/Entity/AgentNotice.vue, real Vuetify, server render).
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { createServer, type Server } from 'node:http'
import { createApp, defineEventHandler, toNodeListener } from 'h3'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createVuetify } from 'vuetify'
import { VAlert } from 'vuetify/components/VAlert'
import { isNonBrowserAgent, isSearchCrawler, showsAgentNotice, NON_BROWSER_AGENTS } from '../lib/agentNotice.mjs'
import AgentNotice from '../../src/components/Entity/AgentNotice.vue'

// Cloudflare WAF rule 4 (id 641d3ed8, "#338 BLOCK: scraper/library User-Agents + empty
// UA"), its `lower(http.user_agent) matches` pattern as read from the zone 2026-10-15
// (oxjob #1689 evidence/waf-custom-before-2026-10-15.json).
const WAF_RULE_4 = '(python-requests|python-urllib|urllib|aiohttp|httpx|scrapy|go-http-client|okhttp|apache-httpclient|httpclient|java/|libwww|lwp::|guzzlehttp|curl/|wget|node-fetch|axios|colly|mechanize|phantomjs|headlesschrome|puppeteer|playwright|selenium|lightpanda|python/|ruby|perl|php/)'

const UA = {
  chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
  safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  googlebot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/141.0.7390.122 Safari/537.36',
  chatgptUser: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  claudeUser: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)',
}

const AGENTS = [
  'curl/8.7.1', 'Wget/1.24.5', 'python-requests/2.32.3', 'python-httpx/0.27.0', 'Python/3.12 aiohttp/3.10.5',
  'Python-urllib/3.12', 'Go-http-client/2.0', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)', 'undici',
  'node', 'axios/1.7.7', 'okhttp/4.12.0', 'Java/21.0.4', 'Apache-HttpClient/5.3 (Java/21)', 'libwww-perl/6.77',
  'Scrapy/2.11.2 (+https://scrapy.org)', 'PostmanRuntime/7.42.0', 'HTTPie/3.2.3', 'GuzzleHttp/7', 'Ruby',
  'Faraday v2.12.0', 'Deno/2.0.0', 'Bun/1.1.30', 'Dart/3.5 (dart:io)', 'colly - https://github.com/gocolly/colly',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.4249', 'Lightpanda/1.0',
  UA.chatgptUser, UA.claudeUser, '',
]
const BROWSERS = [UA.chrome, UA.firefox, UA.safari, UA.edge]
const CRAWLERS = [
  UA.googlebot,
  'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)',
  'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (compatible; GoogleOther)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.3; +https://openai.com/searchbot',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
  'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
  'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
  'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
]

describe('who gets the notice: user agents', () => {
  it.each(AGENTS)('non-browser agent: %j', (ua) => {
    expect(isNonBrowserAgent(ua)).toBe(true)
    expect(isSearchCrawler(ua)).toBe(false)
  })
  it.each(BROWSERS)('browser: %s', (ua) => {
    expect(isNonBrowserAgent(ua)).toBe(false)
    expect(isSearchCrawler(ua)).toBe(false)
  })
  it.each(CRAWLERS)('search or index crawler: %s', (ua) => {
    expect(isSearchCrawler(ua)).toBe(true)
  })
  it('a missing user agent counts as non-browser, as in WAF rule 4', () => {
    expect(isNonBrowserAgent(undefined)).toBe(true)
  })
  it('covers every pattern in Cloudflare WAF rule 4 (641d3ed8)', () => {
    const patterns = WAF_RULE_4.slice(1, -1).split('|')
    expect(patterns).toHaveLength(30)
    for (const p of patterns) expect(NON_BROWSER_AGENTS, p).toContain(p)
  })
})

describe('who gets the notice: the whole request', () => {
  const TOKEN = 'test-secret-token'
  const env = { VERIFIED_ASSISTANT_TOKEN: TOKEN }
  const headers = (h: Record<string, string>) => (name: string) => h[name.toLowerCase()]
  it('a verified assistant does, whatever its user agent', () => {
    expect(showsAgentNotice(headers({ 'user-agent': UA.chrome, 'x-openalex-verified-assistant': TOKEN }), env)).toBe(true)
  })
  it('a wrong token, no token configured, or no header: decided by the user agent alone', () => {
    expect(showsAgentNotice(headers({ 'user-agent': UA.chrome, 'x-openalex-verified-assistant': 'wrong' }), env)).toBe(false)
    expect(showsAgentNotice(headers({ 'user-agent': UA.chrome, 'x-openalex-verified-assistant': TOKEN }), {})).toBe(false)
    expect(showsAgentNotice(headers({ 'user-agent': UA.chrome }), env)).toBe(false)
    expect(showsAgentNotice(headers({ 'user-agent': 'curl/8.7.1', 'x-openalex-verified-assistant': 'wrong' }), env)).toBe(true)
  })
  it('exclusion wins: a search crawler never does, even with a library UA or the assistant header', () => {
    expect(showsAgentNotice(headers({ 'user-agent': UA.googlebot, 'x-openalex-verified-assistant': TOKEN }), env)).toBe(false)
    expect(showsAgentNotice(headers({ 'user-agent': 'python-requests/2.32 (compatible; Googlebot/2.1)' }), env)).toBe(false)
    expect(showsAgentNotice(headers({ 'user-agent': CRAWLERS.at(-1)! }), env)).toBe(false)
  })
})

// The chain on a real server: record middleware -> event.context.oxRecord.agentNotice
// -> the notice in the server-rendered HTML (EntityPage renders AgentNotice the same
// way: v-if on that flag, the record's API URL).
const apiGet = vi.fn()
vi.mock('../lib/ssrApi', () => ({
  apiGet: (...args: any[]) => apiGet(...args),
  RECORD_TIMEOUT_MS: 1500,
  LIST_TIMEOUT_MS: 1500,
}))
const { default: records } = await import('../middleware/02.records')

function renderNotice(apiUrl: string) {
  const app = createSSRApp({ render: () => h(AgentNotice, { apiUrl }) })
  app.use(createVuetify({ ssr: true }))
  app.component('VAlert', VAlert)
  return renderToString(app)
}

let server: Server
let base = ''
beforeAll(async () => {
  const app = createApp()
  app.use(records)
  app.use(defineEventHandler(async (event) => {
    const rec = event.context.oxRecord
    const notice = rec?.agentNotice ? await renderNotice(`https://api.openalex.org/${rec.apiPath}`) : ''
    return `<main>${notice}<h1>${rec?.data?.display_name}</h1></main>`
  }))
  server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  base = `http://127.0.0.1:${(server.address() as any).port}`
})
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))
afterEach(() => vi.unstubAllEnvs())

describe('notice in the server-rendered record page', () => {
  const TOKEN = 'test-secret-token'
  const page = async (headers: Record<string, string>, path = '/works/W2741809807') => {
    apiGet.mockResolvedValue({ status: 'ok', data: { id: `https://openalex.org/${path.split('/').pop()}`, display_name: 'The state of OA' } })
    return (await fetch(base + path, { headers })).text()
  }
  const NOTICE = 'Notice to agents:'

  it.each([
    ['curl/8', true], ['python-requests/2.32', true], ['', true],
    [UA.chrome, false], [UA.googlebot, false],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.3; +https://openai.com/searchbot', false],
  ])('user agent %j -> notice %s', async (ua, want) => {
    expect((await page({ 'user-agent': ua })).includes(NOTICE)).toBe(want)
  })
  it('verified-assistant header: the right token shows it to a browser-like UA, a wrong one does not', async () => {
    vi.stubEnv('VERIFIED_ASSISTANT_TOKEN', TOKEN)
    expect(await page({ 'user-agent': UA.chatgptUser.replace('ChatGPT-User/1.0', 'X'), 'x-openalex-verified-assistant': TOKEN })).toContain(NOTICE)
    expect(await page({ 'user-agent': UA.chrome, 'x-openalex-verified-assistant': TOKEN })).toContain(NOTICE)
    expect(await page({ 'user-agent': UA.chrome, 'x-openalex-verified-assistant': 'wrong' })).not.toContain(NOTICE)
  })
  it('the notice: above the title, the record\'s own API URL and the docs, both links, data-nosnippet, an info callout', async () => {
    const html = await page({ 'user-agent': 'python-requests/2.32' }, '/authors/A5023888391')
    expect(html.indexOf(NOTICE)).toBeLessThan(html.indexOf('<h1>'))
    const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
    expect(text).toContain('Notice to agents: this page is also available from the OpenAlex API, which has more data and is faster: https://api.openalex.org/authors/A5023888391. Docs and a free API key: https://help.openalex.org/api/llm-quick-reference/')
    expect(html).toContain('<strong>Notice to agents:</strong>')
    expect(html).toContain('<a href="https://api.openalex.org/authors/A5023888391">https://api.openalex.org/authors/A5023888391</a>')
    expect(html).toContain('<a href="https://help.openalex.org/api/llm-quick-reference/">https://help.openalex.org/api/llm-quick-reference/</a>')
    expect(html).toMatch(/<div class="v-alert[^"]*v-alert--variant-tonal[^"]*"[^>]*data-nosnippet/)
    expect(html).toMatch(/class="v-alert[^"]*text-info/)
  })
  it('not on the 404 page', async () => {
    apiGet.mockResolvedValue({ status: 'notfound' })
    const r = await fetch(base + '/works/W999', { headers: { 'user-agent': 'curl/8' } })
    expect(r.status).toBe(404)
    expect(await r.text()).not.toContain(NOTICE)
  })
})
