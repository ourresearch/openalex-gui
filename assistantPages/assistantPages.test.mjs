// oxjob #1688: readable openalex.org pages for verified AI assistants.
// Routing (record URLs pass through to the server-rendered page), the secret-header check,
// Accept negotiation, rendering of list and search pages from
// saved API responses (fixtures/, re-record with fixtures/refresh.mjs), and pass-through.

import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assistantPage, route, listQuery, wantsMarkdown, tokenOk, queryString, HEADER } from "./index.mjs";
import { siteUrl, NATIVE, SEARCH_LABEL } from "./pages.mjs";
import { NATIVE_PREFIX_TO_ENTITY } from "../src/openalexId.js";
import { searchParamKeys } from "../src/searchParamKeys.js";
import { toHtml, toMarkdown } from "./format.mjs";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const INDEX = JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf8"));
const TOKEN = "test-secret-1688";
const ENV = { VERIFIED_ASSISTANT_TOKEN: TOKEN, ASSISTANT_PAGES_API_KEY: "test-key-not-real" };

function fixture(url) {
  const hit = INDEX[url];
  if (!hit) throw new Error(`no fixture for ${url}`);
  return JSON.parse(fs.readFileSync(path.join(DIR, hit.file), "utf8"));
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// A fetch that answers from the fixtures and records what it was asked.
function fixtureFetch(overrides = {}) {
  const calls = [];
  const fn = vi.fn(async (url, init) => {
    calls.push({ url, init });
    if (overrides[url]) return overrides[url]();
    return jsonResponse(fixture(url));
  });
  fn.calls = calls;
  return fn;
}

function request(target, { token = TOKEN, accept = "text/html,application/xhtml+xml,*/*;q=0.8", method = "GET" } = {}) {
  const headers = { accept };
  if (token !== null) headers[HEADER] = token;
  return { method, url: new URL(target, "https://openalex.org"), header: (n) => headers[n.toLowerCase()] };
}

async function render(target, opts = {}, fetchImpl = fixtureFetch()) {
  const page = await assistantPage(request(target, opts), ENV, fetchImpl);
  return { page, fetchImpl };
}

describe("route", () => {
  // Record pages are server-rendered for everyone (#1689); assistants read that page.
  it.each([
    "/W2741809807", "/works/W2741809807", "/authors/A5048491430", "/S1983995261", "/funders/F4320306076",
    "/keywords/open-access", "/subfields/1802", "/countries/us",
  ])("record %s passes through to the server-rendered page", (p) => {
    expect(route(new URL(p, "https://openalex.org"))).toBeNull();
  });

  it.each(["/works", "/works?filter=type:article", "/authors?search=piwowar", "/institutions", "/topics?search=coral"])("%s is a list page", (p) => {
    expect(route(new URL(p, "https://openalex.org")).kind).toBe("list");
  });

  it.each([
    "/", "/about", "/pricing", "/team", "/settings", "/login", "/q?oql=works", "/js/app.js", "/favicon.ico",
    "/works/A123", "/authors/W123", "/works/W1/cited-by", "/locations/abc", "/collections/col_x",
    "/X123", "/works/doi:10.1/x", "/keywords/<script>", "/robots.txt", "/me/searches",
  ])("%s passes through", (p) => {
    expect(route(new URL(p, "https://openalex.org"))).toBeNull();
  });
});

describe("listQuery mirrors the website's API URL", () => {
  const q = (type, search) => listQuery(type, new URLSearchParams(search));

  it("defaults: works by citations, other lists by works count", () => {
    expect(q("works", "").query.sort).toBe("cited_by_count:desc");
    expect(q("authors", "").query.sort).toBe("works_count:desc");
  });

  it("a text search sorts by relevance and reranks works inside the top 100", () => {
    const r = q("works", "search.title_and_abstract=coral+reef&page=1");
    expect(r.query).toMatchObject({ "search.title_and_abstract": "coral reef", sort: "relevance_score:desc", rerank: "true", per_page: 25 });
    expect(q("works", "search=coral&page=5").query.rerank).toBeUndefined();
    expect(q("works", "search.semantic=coral").query.rerank).toBeUndefined();
    expect(q("authors", "search=piwowar").query.rerank).toBeUndefined();
  });

  it("a legacy filter search sorts by relevance", () => {
    expect(q("works", "filter=default.search:piARNs&page=1").query.sort).toBe("relevance_score:desc");
  });

  it("keeps filter, sort, page and corpus; drops display-only parameters", () => {
    const r = q("works", "filter=type:types/article&sort=publication_date:desc&page=3&include_xpac=true&column=display_name&group_by=type&v2=true");
    expect(r.query).toEqual({ filter: "type:types/article", sort: "publication_date:desc", per_page: 25, page: 3, include_xpac: "true" });
    expect(q("works", "corpus=all&include_xpac=true").query).toMatchObject({ corpus: "all" });
    expect(q("works", "corpus=all&include_xpac=true").query.include_xpac).toBeUndefined();
  });

  it("clamps a junk page number", () => {
    expect(q("works", "page=-4").page).toBe(1);
    expect(q("works", "page=abc").page).toBe(1);
  });

  it("writes readable query strings", () => {
    expect(queryString({ filter: "authorships.institutions.lineage:i1|i2,type:article", search: "a b", x: undefined })).toBe(
      "filter=authorships.institutions.lineage:i1|i2,type:article&search=a+b",
    );
    expect(queryString({ filter: "institutions.id:I1+I2" })).toBe("filter=institutions.id:I1%2BI2");
  });
});

describe("header check", () => {
  it("tokenOk: right, wrong, absent, unset", () => {
    expect(tokenOk(TOKEN, TOKEN)).toBe(true);
    expect(tokenOk("guess", TOKEN)).toBe(false);
    expect(tokenOk(`${TOKEN}x`, TOKEN)).toBe(false);
    expect(tokenOk(undefined, TOKEN)).toBe(false);
    expect(tokenOk("", TOKEN)).toBe(false);
    expect(tokenOk(TOKEN, undefined)).toBe(false);
    expect(tokenOk(TOKEN, "")).toBe(false);
  });

  it.each([
    ["absent", null],
    ["wrong", "guess"],
    ["a spoofed user agent's guess", "1"],
  ])("header %s: the website answers and the API is never called", async (_, token) => {
    const { page, fetchImpl } = await render("/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc", { token });
    expect(page).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("no secret configured: inert even when a header is sent", async () => {
    const f = fixtureFetch();
    const page = await assistantPage(request("/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc"), { VERIFIED_ASSISTANT_TOKEN: "" }, f);
    expect(page).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("right header, but a company page or POST: the website answers", async () => {
    expect((await render("/pricing")).page).toBeNull();
    expect((await render("/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc", { method: "POST" })).page).toBeNull();
  });
});

describe("Accept", () => {
  it.each([
    ["text/markdown", true],
    ["text/markdown, text/html;q=0.9", true],
    ["text/x-markdown", true],
    ["text/html, text/markdown;q=0.5", false],
    ["text/html,application/xhtml+xml,*/*;q=0.8", false],
    ["*/*", false],
    ["", false],
    [undefined, false],
  ])("%s -> markdown %s", (accept, want) => {
    expect(wantsMarkdown(accept)).toBe(want);
  });
});

describe("list and search pages", () => {
  it("a works search: count, 25 results, the API URL that reproduces it", async () => {
    const target = "/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc";
    const { page, fetchImpl } = await render(target, { accept: "text/markdown" });
    expect(page.status).toBe(200);
    expect(page.body).toMatch(/^# Works: "meta results"/);
    expect(page.body).toMatch(/[\d,]+ works match\. This page lists 1 to 25, sorted by relevance\./);
    expect(page.body).toContain("- **Search in titles and abstracts:** meta results");
    expect(page.body).toContain("Same list in the API:** https://api.openalex.org/works?search.title_and_abstract=meta+results&sort=relevance_score:desc&per_page=25&rerank=true");
    expect(page.body).toMatch(/\n25\. \[/);
    expect(page.body).toContain("Next page: https://openalex.org/works?page=2&search.title_and_abstract=meta+results&sort=relevance_score%3Adesc");
    expect(page.headers.Link).toBe(`<https://openalex.org${target}>; rel="canonical"`);
    // the fetch narrows fields; the URL shown to the reader doesn't
    expect(fetchImpl.calls[0].url).toContain("&select=");
    expect(page.body).not.toContain("select=");
  });

  it("an author search", async () => {
    const { page } = await render("/authors?search=Said+Alvarado-Marin", { accept: "text/markdown" });
    expect(page.body).toContain("1 author matches.");
    expect(page.body).toContain("1. [Said Alvarado-Marin](https://openalex.org/authors/A5058174700)");
  });

  it("HTML list numbering continues on later pages", () => {
    const html = toHtml({ title: "t", canonical: "https://openalex.org/works", intro: "", sections: [{ heading: "Results", blocks: [{ ol: ["a", "b"], start: 26 }] }] });
    expect(html).toContain('<ol start="26">');
    expect(toMarkdown({ title: "t", sections: [{ blocks: [{ ol: ["a"], start: 26 }] }] })).toContain("26. a");
  });
});

describe("API errors become plain pages", () => {
  it("400 (a bad filter) -> 400 page with the API's reason", async () => {
    const url = "https://api.openalex.org/works?filter=bogus:1&sort=cited_by_count:desc&per_page=25&select=id,display_name,publication_year,type,cited_by_count,doi,authorships,primary_location,open_access,is_retracted";
    const f = fixtureFetch({ [url]: () => jsonResponse({ error: "Invalid query parameters error.", message: "bogus is not a valid field." }, 400) });
    const { page } = await render("/works?filter=bogus:1", { accept: "text/markdown" }, f);
    expect(page.status).toBe(400);
    expect(page.body).toContain("bogus is not a valid field.");
  });

  it("a paid-plan query gets the API's own refusal (the server key has no paid plan)", async () => {
    const url = "https://api.openalex.org/works?filter=from_created_date:2026-01-01&sort=cited_by_count:desc&per_page=25&select=id,display_name,publication_year,type,cited_by_count,doi,authorships,primary_location,open_access,is_retracted";
    const refusal = { error: "Plan upgrade required", message: 'The "from_created_date:2026-01-01" filter requires a Premium, Institutional, or Partner plan. See https://openalex.org/pricing for details.' };
    const f = fixtureFetch({ [url]: () => jsonResponse(refusal, 429) });
    const { page } = await render("/works?filter=from_created_date:2026-01-01", { accept: "text/markdown" }, f);
    expect(page.status).toBe(400);
    expect(page.body).toContain("requires a Premium, Institutional, or Partner plan. See https://openalex.org/pricing for details.");
    expect(page.body).not.toContain("details..");
    expect(f.calls).toHaveLength(1);
  });

  describe("a busy API (429 with Retry-After)", () => {
    const SEARCH_API = "https://api.openalex.org/works?search.title_and_abstract=meta+results&sort=relevance_score:desc&per_page=25&rerank=true&select=id,display_name,publication_year,type,cited_by_count,doi,authorships,primary_location,open_access,is_retracted";
    const busy = (retryAfter = "1") =>
      new Response(JSON.stringify({ error: "Rate limit exceeded", message: "Rate limit exceeded: 50 requests per second. Please slow down." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": retryAfter },
      });
    // Only setTimeout is faked: AbortSignal.timeout keeps real time.
    async function renderWaiting(target, f) {
      vi.useFakeTimers({ toFake: ["setTimeout"] });
      try {
        const pending = render(target, { accept: "text/markdown" }, f);
        await vi.advanceTimersByTimeAsync(2000);
        return await pending;
      } finally {
        vi.useRealTimers();
      }
    }

    it("is waited out once, and the page is served", async () => {
      let n = 0;
      const f = fixtureFetch({ [SEARCH_API]: () => (++n === 1 ? busy() : jsonResponse(fixture(SEARCH_API))) });
      const { page } = await renderWaiting("/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc", f);
      expect(page.status).toBe(200);
      expect(page.body).toMatch(/^# Works: "meta results"/);
      expect(f.calls).toHaveLength(2);
    });

    it("still busy after the wait -> 503, try again", async () => {
      const f = fixtureFetch({ [SEARCH_API]: () => busy() });
      const { page } = await renderWaiting("/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc", f);
      expect(page.status).toBe(503);
      expect(page.body).toContain("did not answer for this works list just now (too many requests at once). Try again in a moment.");
      expect(f.calls).toHaveLength(2);
    });

    it("a long Retry-After (a shed search) -> 503 at once", async () => {
      const f = fixtureFetch({ [SEARCH_API]: () => busy("15") });
      const { page } = await render("/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc", { accept: "text/markdown" }, f);
      expect(page.status).toBe(503);
      expect(f.calls).toHaveLength(1);
    });
  });

  it("network failure -> 502, never an exception", async () => {
    const f = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const { page } = await render("/works?page=1&search.title_and_abstract=meta+results&sort=relevance_score:desc", {}, f);
    expect(page.status).toBe(502);
    expect(page.body).toContain("did not answer");
  });
});

describe("tables copied from the app stay equal to it", () => {
  // The server can't import src/ at runtime (no "type": "module"; "@/" imports), so it keeps copies.
  it("id prefixes match src/openalexId.js", () => {
    expect(NATIVE).toEqual(NATIVE_PREFIX_TO_ENTITY);
  });
  it("search parameters match src/searchParamKeys.js", () => {
    expect(Object.keys(SEARCH_LABEL)).toEqual(searchParamKeys);
  });
});

describe("helpers", () => {
  it("siteUrl gives the website's long form", () => {
    expect(siteUrl("https://openalex.org/W1")).toBe("https://openalex.org/works/W1");
    expect(siteUrl("https://openalex.org/keywords/kelp")).toBe("https://openalex.org/keywords/kelp");
    expect(siteUrl(null)).toBeNull();
  });
});
