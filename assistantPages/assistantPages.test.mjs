// oxjob #1688: readable openalex.org pages for verified AI assistants.
// Routing, the secret-header check, Accept negotiation, rendering of each entity type from
// saved API responses (fixtures/, re-record with fixtures/refresh.mjs), and pass-through.

import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assistantPage, route, listQuery, wantsMarkdown, tokenOk, queryString, HEADER } from "./index.mjs";
import { abstractText, siteUrl, NATIVE, SEARCH_LABEL } from "./pages.mjs";
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
  it.each([
    ["/W2741809807", { kind: "entity", type: "works", id: "W2741809807" }],
    ["/w2741809807", { kind: "entity", type: "works", id: "W2741809807" }],
    ["/works/W2741809807", { kind: "entity", type: "works", id: "W2741809807" }],
    ["/works/w2741809807/", { kind: "entity", type: "works", id: "W2741809807" }],
    ["/A5048491430", { kind: "entity", type: "authors", id: "A5048491430" }],
    ["/S1983995261", { kind: "entity", type: "sources", id: "S1983995261" }],
    ["/I136199984", { kind: "entity", type: "institutions", id: "I136199984" }],
    ["/T13607", { kind: "entity", type: "topics", id: "T13607" }],
    ["/funders/F4320306076", { kind: "entity", type: "funders", id: "F4320306076" }],
    ["/publishers/P4310320595", { kind: "entity", type: "publishers", id: "P4310320595" }],
    ["/keywords/open-access", { kind: "entity", type: "keywords", id: "open-access" }],
    ["/subfields/1802", { kind: "entity", type: "subfields", id: "1802" }],
    ["/countries/us", { kind: "entity", type: "countries", id: "us" }],
  ])("%s is an entity page", (p, want) => {
    expect(route(new URL(p, "https://openalex.org"))).toEqual(want);
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
    const { page, fetchImpl } = await render("/W2741809807", { token });
    expect(page).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("no secret configured: inert even when a header is sent", async () => {
    const f = fixtureFetch();
    const page = await assistantPage(request("/W2741809807"), { VERIFIED_ASSISTANT_TOKEN: "" }, f);
    expect(page).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("right header, but a company page or POST: the website answers", async () => {
    expect((await render("/pricing")).page).toBeNull();
    expect((await render("/W2741809807", { method: "POST" })).page).toBeNull();
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

describe("work page", () => {
  it("HTML: facts, authors with institutions, abstract, canonical, noindex, API line", async () => {
    const { page, fetchImpl } = await render("/W2741809807");
    expect(page.status).toBe(200);
    expect(page.headers["Content-Type"]).toBe("text/html; charset=utf-8");
    expect(page.headers["X-Robots-Tag"]).toBe("noindex");
    expect(page.headers["Cache-Control"]).toContain("no-store");
    const b = page.body;
    expect(b).toContain("<title>The state of OA: a large-scale analysis of the prevalence and impact of Open Access articles | OpenAlex</title>");
    expect(b).toContain('<link rel="canonical" href="https://openalex.org/works/W2741809807">');
    expect(b).toContain('<meta name="robots" content="noindex">');
    expect(b).toContain('<a href="https://openalex.org/authors/A5048491430">Heather Piwowar</a>');
    expect(b).toContain('<a href="https://openalex.org/institutions/I4200000001">OpenAlex</a> (CA)');
    expect(b).toContain("<strong>Year:</strong> 2018");
    expect(b).toContain('<a href="https://openalex.org/sources/S1983995261">PeerJ</a> (journal)');
    expect(b).toContain("https://doi.org/10.7717/peerj.4375");
    expect(b).toContain("<strong>Open access:</strong> yes (gold)");
    expect(b).toMatch(/<strong>Cited by:<\/strong> [\d,]+ works/);
    expect(b).toContain("Academic Publishing and Open Access");
    expect(b).toContain("<h2>Abstract</h2>");
    expect(b).toContain("Despite growing interest in Open Access");
    expect(b).toContain("Structured data: <a href=\"https://api.openalex.org/works/W2741809807\">");
    expect(b).toContain("https://help.openalex.org/llms.txt");
    // one API call, with the server key as a Bearer header, never in the URL or the page
    expect(fetchImpl.calls).toHaveLength(1);
    expect(fetchImpl.calls[0].url).toBe("https://api.openalex.org/works/W2741809807");
    expect(fetchImpl.calls[0].init.headers.Authorization).toBe("Bearer test-key-not-real");
    expect(b).not.toContain("test-key-not-real");
  });

  it("Markdown when asked, same facts", async () => {
    const { page } = await render("/works/W2741809807", { accept: "text/markdown" });
    expect(page.headers["Content-Type"]).toBe("text/markdown; charset=utf-8");
    expect(page.body).toMatch(/^# The state of OA/);
    expect(page.body).toContain("- **Year:** 2018");
    expect(page.body).toContain("1. [Heather Piwowar](https://openalex.org/authors/A5048491430), ORCID 0000-0003-1613-5981: [OpenAlex](https://openalex.org/institutions/I4200000001) (CA)");
    expect(page.body).toContain("Structured data: https://api.openalex.org/works/W2741809807 (free; docs https://help.openalex.org/llms.txt)");
  });

  it("no abstract for a closed work (the website shows it only for open access)", async () => {
    const w = fixture("https://api.openalex.org/works/W2741809807");
    const closed = { ...w, open_access: { is_oa: false, oa_status: "closed" }, best_oa_location: null };
    const f = fixtureFetch({ "https://api.openalex.org/works/W2741809807": () => jsonResponse(closed) });
    const { page } = await render("/W2741809807", {}, f);
    expect(page.body).not.toContain("Abstract");
    expect(page.body).toContain("<strong>Open access:</strong> no (closed)");
  });

  it("lists 20 authors, then says how many more", async () => {
    const w = fixture("https://api.openalex.org/works/W2741809807");
    const many = { ...w, authorships: Array.from({ length: 23 }, (_, i) => ({ ...w.authorships[0], author: { ...w.authorships[0].author, display_name: `Author ${i + 1}` } })) };
    const f = fixtureFetch({ "https://api.openalex.org/works/W2741809807": () => jsonResponse(many) });
    const { page } = await render("/W2741809807", { accept: "text/markdown" }, f);
    expect(page.body).toContain("## Authors (23)");
    expect(page.body).toContain("20. [Author 20]");
    expect(page.body).not.toContain("[Author 21]");
    expect(page.body).toContain("And 3 more authors");
  });

  it("strips markup from titles and escapes what is left", async () => {
    const w = fixture("https://api.openalex.org/works/W2741809807");
    const odd = { ...w, display_name: "Growth of <i>E. coli</i> & <script>alert(1)</script> [x] *y*" };
    const f = fixtureFetch({ "https://api.openalex.org/works/W2741809807": () => jsonResponse(odd) });
    const html = (await render("/W2741809807", {}, f)).page.body;
    expect(html).toContain("<h1>Growth of E. coli &amp; alert(1) [x] *y*</h1>");
    expect(html).not.toContain("<script>");
    const md = (await render("/W2741809807", { accept: "text/markdown" }, fixtureFetch({ "https://api.openalex.org/works/W2741809807": () => jsonResponse(odd) }))).page.body;
    expect(md).toMatch(/^# Growth of E\. coli & alert\(1\) \\\[x\\\] \\\*y\\\*$/m);
  });
});

describe("other entity pages", () => {
  it.each([
    ["/authors/A5048491430", "Heather Piwowar", ["ORCID:** https://orcid.org/0000-0003-1613-5981", "h-index:**", "Last known institution:** [OpenAlex]", "## Most-cited works (top 10)", "1. [The state of OA", "All works: https://openalex.org/works?filter=author.id:A5048491430", "Structured data: https://api.openalex.org/authors/A5048491430"]],
    ["/S1983995261", "PeerJ", ["Publisher:** [PeerJ, Inc.](https://openalex.org/publishers/P4310320104)", "ISSN-L:** 2167-8359", "In DOAJ:** yes, since 2013", "## Most-cited works (top 10)", "Structured data: https://api.openalex.org/sources/S1983995261"]],
    ["/institutions/I136199984", "Harvard University", ["Location:** Cambridge, Massachusetts, United States", "ROR:** https://ror.org/03vek6s52", "## Most-cited works (top 10)", "Structured data: https://api.openalex.org/institutions/I136199984"]],
    ["/T13607", "Academic Publishing and Open Access", ["Subfield:** [Information Systems and Management](https://openalex.org/subfields/1802)", "Keywords:** open access", "## Most-cited works (top 10)", "Structured data: https://api.openalex.org/topics/T13607"]],
    ["/funders/F4320306076", "National Science Foundation", ["Also known as:**", "NSF", "ROR:** https://ror.org/021nxhr62", "## Most-cited works (top 10)", "Structured data: https://api.openalex.org/funders/F4320306076"]],
    ["/P4310320595", "Wiley", ["Its journals and other sources:** https://openalex.org/sources?filter=host_organization.id:P4310320595", "## Most-cited works (top 10)", "Structured data: https://api.openalex.org/publishers/P4310320595"]],
    ["/keywords/open-access", "open access", ["Description:** A publishing model", "Works:**", "https://openalex.org/works?filter=keywords.id:keywords/open-access", "## Most-cited works (top 10)", "Structured data: https://api.openalex.org/keywords/open-access"]],
  ])("%s", async (target, title, needles) => {
    const { page } = await render(target, { accept: "text/markdown" });
    expect(page.status).toBe(200);
    expect(page.body.split("\n")[0]).toBe(`# ${title}`);
    for (const n of needles) expect(page.body).toContain(n);
  });

  it("a failed works list costs the section, not the page", async () => {
    const f = fixtureFetch({
      "https://api.openalex.org/works?filter=author.id:A5048491430&sort=cited_by_count:desc&per_page=10&select=id,display_name,publication_year,cited_by_count,primary_location":
        () => jsonResponse({ error: "boom" }, 500),
    });
    const { page } = await render("/A5048491430", { accept: "text/markdown" }, f);
    expect(page.status).toBe(200);
    expect(page.body).toContain("# Heather Piwowar");
    expect(page.body).not.toContain("Most-cited works");
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
  it("404 -> 404 page that says so", async () => {
    const f = fixtureFetch({ "https://api.openalex.org/works/W1": () => jsonResponse({ error: "Not found" }, 404) });
    const { page } = await render("/W1", { accept: "text/markdown" }, f);
    expect(page.status).toBe(404);
    expect(page.body).toContain("OpenAlex has no work W1. It may have been removed or merged into another record.");
    expect(page.body).toContain("Search works: `https://api.openalex.org/works?search=<title words>` (free)");
    expect(page.body).toContain("Docs for agents: https://help.openalex.org/llms.txt");
    // The dead API URL answers with an HTML 404, so the page doesn't offer it as structured data.
    expect(page.body).not.toContain("https://api.openalex.org/works/W1");
    expect(page.body).not.toContain("Structured data");
  });

  it("404 HTML page names the author search and keeps status 404", async () => {
    const f = fixtureFetch({ "https://api.openalex.org/authors/A1": () => jsonResponse({ error: "Not found" }, 404) });
    const { page } = await render("/authors/A1", {}, f);
    expect(page.status).toBe(404);
    expect(page.body).toContain("OpenAlex has no author A1. It may have been removed or merged into another record.");
    expect(page.body).toContain("<code>https://api.openalex.org/authors?search=&lt;name words&gt;</code>");
    expect(page.body).not.toContain('href="https://api.openalex.org/authors/A1"');
  });

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
  });

  it("network failure -> 502, never an exception", async () => {
    const f = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const { page } = await render("/W2741809807", {}, f);
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
  it("abstractText rebuilds the words in order and drops a leading 'Abstract'", () => {
    expect(abstractText({ Abstract: [0], world: [2], hello: [1] })).toBe("hello world");
    expect(abstractText(null)).toBe("");
  });

  it("siteUrl gives the website's long form", () => {
    expect(siteUrl("https://openalex.org/W1")).toBe("https://openalex.org/works/W1");
    expect(siteUrl("https://openalex.org/keywords/kelp")).toBe("https://openalex.org/keywords/kelp");
    expect(siteUrl(null)).toBeNull();
  });
});
