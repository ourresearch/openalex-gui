// oxjob #1689: who sees the "Notice to agents" at the top of a server-rendered
// record page (src/components/Entity/AgentNotice.vue). Decided on the server, per
// request, by the record middleware (server/middleware/02.records.ts).
//
//   1. Search and index crawlers never see it, whatever else their request says:
//      the notice is not part of the record, and must not end up in a snippet.
//      Exclusion wins over everything below.
//   2. Verified AI assistants do (ChatGPT-User, Claude-User, Perplexity-User...):
//      Cloudflare marks their requests with #1688's X-OpenAlex-Verified-Assistant
//      secret; tokenOk() is #1688's constant-time check.
//   3. Non-browser user agents do: HTTP libraries, command-line tools, headless
//      browsers, and the AI assistants' own fetchers when the header is missing.
//      Covers every pattern in Cloudflare WAF rule 4 (id 641d3ed8, "scraper/library
//      User-Agents + empty UA"), including the empty user agent.
//   4. Everyone else (browsers) doesn't.
import { tokenOk, HEADER as ASSISTANT_HEADER } from '../../assistantPages/index.mjs';

// Lowercase substrings of the User-Agent header.
export const SEARCH_CRAWLERS = [
  // Google's search and index crawlers (not its user-triggered fetchers).
  'googlebot', 'google-inspectiontool', 'storebot-google', 'googleother', 'adsbot-google',
  'mediapartners-google', 'apis-google', 'google-cloudvertexbot',
  'bingbot', 'bingpreview', 'msnbot', 'adidxbot',
  'oai-searchbot', 'claude-searchbot', 'perplexitybot',
  'applebot', 'duckduckbot', 'duckassistbot', 'yandexbot', 'yandex.com/bots', 'baiduspider',
  'slurp', 'seznambot', 'sogou', 'qwantbot', 'mojeekbot', 'petalbot', 'naver.me/spd', 'coccocbot',
  'exabot', 'amazonbot',
  // Link previews, not a search engine; its UA contains Apache-HttpClient (WAF rule 4 exempts it too).
  'linkedinbot',
];

export const NON_BROWSER_AGENTS = [
  // WAF rule 4, in its order.
  'python-requests', 'python-urllib', 'urllib', 'aiohttp', 'httpx', 'scrapy', 'go-http-client',
  'okhttp', 'apache-httpclient', 'httpclient', 'java/', 'libwww', 'lwp::', 'guzzlehttp', 'curl/',
  'wget', 'node-fetch', 'axios', 'colly', 'mechanize', 'phantomjs', 'headlesschrome', 'puppeteer',
  'playwright', 'selenium', 'lightpanda', 'python/', 'ruby', 'perl', 'php/',
  // More libraries and tools.
  'undici', 'postmanruntime', 'httpie', 'insomnia', 'deno/', 'bun/', 'dart/', 'faraday',
  'reqwest', 'superagent', 'sindresorhus/got', 'restsharp', 'rest-client', 'http.rb', 'windowspowershell',
  // AI assistants fetching for a person (normally also verified by the header above).
  'chatgpt-user', 'claude-user', 'perplexity-user', 'mistralai-user',
];

const lower = (ua) => String(ua ?? '').toLowerCase();
const anyOf = (ua, list) => list.some((s) => ua.includes(s));

export const isSearchCrawler = (ua) => anyOf(lower(ua), SEARCH_CRAWLERS);

// Empty counts (WAF rule 4 treats it the same). Node's built-in fetch sends just "node".
export function isNonBrowserAgent(ua) {
  const s = lower(ua).trim();
  return s === '' || s === 'node' || anyOf(s, NON_BROWSER_AGENTS);
}

// header: (name) => string | undefined, as in assistantPages' assistantPage().
export function showsAgentNotice(header, env = process.env) {
  const ua = header('user-agent');
  if (isSearchCrawler(ua)) return false;
  return tokenOk(header(ASSISTANT_HEADER), env.VERIFIED_ASSISTANT_TOKEN) || isNonBrowserAgent(ua);
}
