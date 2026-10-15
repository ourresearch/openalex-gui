// oxjob #1688: readable openalex.org pages for verified AI assistants.
//
// ChatGPT, Claude and other assistants fetch openalex.org pages for a person, but they
// don't run JavaScript, so the single-page app gives them an empty shell. Cloudflare
// knows which requests come from a verified AI assistant: a Transform Rule sets
// X-OpenAlex-Verified-Assistant to a secret on those requests only (SHIP.md in the job
// folder). For them, and for an entity or list URL, this module builds a plain page from
// api.openalex.org: HTML by default, Markdown when the Accept header asks for it.
// Everything else, and everyone else, gets the normal site (assistantPage returns null).
//
// Framework-free on purpose: server.js adapts it to Express, tests call it directly.

import crypto from "node:crypto";
import { toHtml, toMarkdown } from "./format.mjs";
import { entityPage, listPage, errorPage, knownWorksFilter, worksFilterOf, listSelect, API, NATIVE, SINGULAR, SEARCH_LABEL } from "./pages.mjs";

export const HEADER = "x-openalex-verified-assistant";
const PER_PAGE = 25;
const TOP_WORKS = 10;
const RERANK_WINDOW = 100; // the website reranks searches whose page starts inside the top 100 (url.js)
const TIMEOUT_MS = 10000;

// Native ids have a one-letter prefix; the website accepts /W123 too.
const PREFIX = Object.fromEntries(Object.entries(NATIVE).map(([k, v]) => [v, k]));
const ENTITY_TYPES = new Set(Object.keys(SINGULAR));
export const SEARCH_KEYS = Object.keys(SEARCH_LABEL); // one is used at a time
const TOP_WORKS_SELECT = "id,display_name,publication_year,cited_by_count,primary_location";

// Query strings readable by a person or a model: only what must be escaped is.
export function queryString(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v)).replace(/%3A/gi, ":").replace(/%2C/gi, ",").replace(/%7C/gi, "|").replace(/%2F/gi, "/").replace(/%20/g, "+")}`)
    .join("&");
}

// Which page a website URL is, or null for anything this module doesn't handle.
export function route(url) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  let m = path.match(/^\/([a-z])(\d+)$/i);
  if (m && NATIVE[m[1].toLowerCase()]) {
    return { kind: "entity", type: NATIVE[m[1].toLowerCase()], id: m[1].toUpperCase() + m[2] };
  }
  m = path.match(/^\/([a-z-]+)\/([^/]+)$/);
  if (m && ENTITY_TYPES.has(m[1])) {
    const type = m[1];
    let id;
    try {
      id = decodeURIComponent(m[2]);
    } catch {
      return null;
    }
    if (PREFIX[type]) {
      if (!/^[a-z]\d+$/i.test(id) || id[0].toLowerCase() !== PREFIX[type]) return null;
      id = id.toUpperCase();
    } else if (!/^[\w.-]+$/.test(id)) {
      return null;
    }
    return { kind: "entity", type, id };
  }
  m = path.match(/^\/([a-z-]+)$/);
  if (m && ENTITY_TYPES.has(m[1])) return { kind: "list", type: m[1], ...listQuery(m[1], url.searchParams) };
  return null;
}

// The API query behind a website list or search URL. They share filter, search and sort
// syntax; this mirrors makeApiUrl in src/url.js (default sort, rerank), minus the
// display-only parameters (column, group_by, view, v2).
export function listQuery(type, params) {
  const q = {};
  const filter = params.get("filter");
  if (filter) q.filter = filter;
  const searchKey = SEARCH_KEYS.find((k) => params.get(k));
  if (searchKey) q[searchKey] = params.get(searchKey);
  const filterSearch = (filter || "").split(",").some((f) => f.split(":")[0].includes(".search"));
  const defaultSort = { works: "cited_by_count:desc", awards: "amount:desc" }[type] || "works_count:desc";
  q.sort = params.get("sort") || (searchKey || filterSearch ? "relevance_score:desc" : defaultSort);
  const page = Math.max(1, Math.min(10000, parseInt(params.get("page"), 10) || 1));
  q.per_page = PER_PAGE;
  if (page > 1) q.page = page;
  if (params.get("corpus")) q.corpus = params.get("corpus");
  else if (params.get("include_xpac") === "true") q.include_xpac = "true";
  if (type === "works" && q.sort === "relevance_score:desc" && searchKey && searchKey !== "search.semantic" && (page - 1) * PER_PAGE < RERANK_WINDOW) {
    q.rerank = "true";
  }
  return { query: q, page, searchKey };
}

// HTML unless the client asks for Markdown at least as strongly.
export function wantsMarkdown(accept) {
  if (!accept) return false;
  const q = {};
  for (const part of accept.toLowerCase().split(",")) {
    const [type, ...params] = part.trim().split(";");
    const qp = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    q[type.trim()] = qp ? parseFloat(qp.slice(2)) || 0 : 1;
  }
  const md = Math.max(q["text/markdown"] ?? 0, q["text/x-markdown"] ?? 0);
  return md > 0 && md >= (q["text/html"] ?? 0);
}

// Constant-time: the header is a shared secret; hashing first makes the lengths equal.
export function tokenOk(got, want) {
  if (!got || !want) return false;
  const a = crypto.createHash("sha256").update(String(got)).digest();
  const b = crypto.createHash("sha256").update(String(want)).digest();
  return crypto.timingSafeEqual(a, b);
}

class ApiError extends Error {
  constructor(status, message, apiUrl) {
    super(message);
    this.status = status;
    this.apiUrl = apiUrl;
  }
}

// A 429 with Retry-After is a busy moment, not a bad request: the API's per-second cap (50/s on the
// server key's plan) or a shed search. ChatGPT fetches up to ~90 pages in one second, so a short
// wait is taken once, with jitter so the retries don't arrive together. A 429 without Retry-After
// is the API refusing a paid-plan feature: a 400 below, never retried.
const MAX_RETRY_WAIT_S = 2;

function makeGetJson(env, fetchImpl) {
  return async function getJson(pathAndQuery, publicUrl) {
    const headers = { Accept: "application/json", "User-Agent": "openalex.org assistant pages (oxjob 1688)" };
    if (env.ASSISTANT_PAGES_API_KEY) headers.Authorization = `Bearer ${env.ASSISTANT_PAGES_API_KEY}`;
    for (let attempt = 1; ; attempt++) {
      let res;
      try {
        res = await fetchImpl(`${API}${pathAndQuery}`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
      } catch (err) {
        throw new ApiError(502, `the API did not answer (${err.name})`, publicUrl);
      }
      const retryAfter = res.status === 429 ? res.headers.get("retry-after") : null;
      if (retryAfter !== null && attempt === 1 && Number(retryAfter) <= MAX_RETRY_WAIT_S) {
        await res.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, Number(retryAfter) * 1000 + Math.random() * 500));
        continue;
      }
      let body = null;
      try {
        body = await res.json();
      } catch {
        // fall through: a non-JSON answer is an error below
      }
      if (!res.ok || !body || body.error) {
        if (retryAfter !== null) throw new ApiError(503, "too many requests at once", publicUrl);
        const status = res.status === 404 ? 404 : res.status >= 400 && res.status < 500 ? 400 : 502;
        const why = body?.message || body?.error || `HTTP ${res.status}`;
        throw new ApiError(status, typeof why === "string" ? why : JSON.stringify(why), publicUrl);
      }
      return body;
    }
  };
}

// The record, and for anything but a work its 10 most-cited works: both at once when the works
// filter is known from the id, else after the record (from its works_api_url). A failed works list
// costs the section, not the page.
async function buildEntity(r, getJson) {
  const apiPath = `/${r.type}/${encodeURIComponent(r.id)}`;
  const publicUrl = `${API}${apiPath}`;
  const topWorks = (filter) =>
    filter ? getJson(`/works?${queryString({ filter, sort: "cited_by_count:desc", per_page: TOP_WORKS, select: TOP_WORKS_SELECT })}`, publicUrl).catch(() => null) : null;
  const known = knownWorksFilter(r.type, r.id);
  const [record, top] = await Promise.all([getJson(apiPath, publicUrl), topWorks(known)]);
  return entityPage(r.type, record, known ? top : await topWorks(worksFilterOf(record)));
}

// Paid-plan features (created/updated-date filters and sorts) are refused by the API itself: the server
// key has no paid plan (SHIP.md), so an assistant gets the answer a free user gets.
async function buildList(r, url, getJson) {
  const publicUrl = `${API}/${r.type}?${queryString(r.query)}`;
  const data = await getJson(`/${r.type}?${queryString({ ...r.query, select: listSelect(r.type) })}`, publicUrl);
  return listPage(r, url, data, publicUrl);
}

// The page for this request, or null to let the website answer as usual.
// req: { method, url (a URL on openalex.org), header(name) -> string|undefined }
// env: { VERIFIED_ASSISTANT_TOKEN, ASSISTANT_PAGES_API_KEY }
export async function assistantPage(req, env, fetchImpl = fetch) {
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  if (!tokenOk(req.header(HEADER), env.VERIFIED_ASSISTANT_TOKEN)) return null;
  const r = route(req.url);
  if (!r) return null;

  const getJson = makeGetJson(env, fetchImpl);
  let page;
  let status = 200;
  try {
    page = r.kind === "entity" ? await buildEntity(r, getJson) : await buildList(r, req.url, getJson);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    status = err.status;
    page = errorPage(r, req.url, err);
  }
  const md = wantsMarkdown(req.header("accept"));
  return {
    status,
    headers: {
      "Content-Type": md ? "text/markdown; charset=utf-8" : "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      Vary: "Accept",
      Link: `<${page.canonical}>; rel="canonical"`,
    },
    body: md ? toMarkdown(page) : toHtml(page),
  };
}
