// oxjob #1688: what each assistant page says, as a page model (format.mjs writes it out).
// Plain and factual: a list or search's results, links an assistant can follow, and the
// API URL that reproduces the list. Record pages are server-rendered for everyone (#1689).

import { clean } from "./format.mjs";

const SITE = "https://openalex.org";
export const API = "https://api.openalex.org";
const DOCS = "https://help.openalex.org/llms.txt";

// One-letter id prefixes (src/openalexId.js NATIVE_PREFIX_TO_ENTITY; a test keeps them equal).
export const NATIVE = { w: "works", a: "authors", s: "sources", i: "institutions", p: "publishers", f: "funders", c: "concepts", t: "topics", g: "awards" };

// Every entity type a page is built for (keys) and its singular.
export const SINGULAR = {
  works: "work", authors: "author", sources: "source", institutions: "institution", publishers: "publisher",
  funders: "funder", topics: "topic", concepts: "concept", awards: "award", keywords: "keyword",
  subfields: "subfield", fields: "field", domains: "domain", sdgs: "sustainable development goal",
  countries: "country", continents: "continent", languages: "language",
};

// The website's search parameters (src/searchParamKeys.js; a test keeps them equal), with how a page names them.
export const SEARCH_LABEL = {
  search: "Search",
  "search.exact": "Search (exact words)",
  "search.semantic": "Search by meaning",
  "search.title": "Search in titles",
  "search.title.exact": "Search in titles (exact words)",
  "search.title_and_abstract": "Search in titles and abstracts",
  "search.title_and_abstract.exact": "Search in titles and abstracts (exact words)",
  "search.title_abstract_keywords": "Search in titles, abstracts and keywords",
  "search.title_abstract_keywords.exact": "Search in titles, abstracts and keywords (exact words)",
};

const link = (text, href) => (href ? { text: String(text ?? href), href } : text);
const url = (u) => link(u, u);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function num(x) {
  if (typeof x !== "number") return x ?? "";
  return Number.isInteger(x) ? String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : x.toFixed(2);
}

// "https://openalex.org/W123" -> "W123"; "https://openalex.org/keywords/kelp" -> "keywords/kelp"
function shortId(apiId) {
  return String(apiId ?? "").replace(/^https?:\/\/openalex\.org\//, "");
}

// The website page for an API id: native ids get the long form the website uses.
export function siteUrl(apiId) {
  if (!apiId) return null;
  const s = shortId(apiId);
  const m = s.match(/^([a-z])(\d+)$/i);
  if (m && NATIVE[m[1].toLowerCase()]) return `${SITE}/${NATIVE[m[1].toLowerCase()]}/${m[1].toUpperCase()}${m[2]}`;
  return `${SITE}/${s}`;
}

function facts(rows) {
  return { facts: rows.filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) };
}

function lastText(x) {
  if (Array.isArray(x)) {
    for (let i = x.length - 1; i >= 0; i--) {
      const t = lastText(x[i]);
      if (t) return t;
    }
    return "";
  }
  if (x && typeof x === "object") return clean(x.code ?? x.text ?? x.href);
  return clean(x);
}

// Pieces joined as sentences: ". " between them and "." at the end, unless a piece already ends one
// ("PeerJ, Inc." stays one period).
function sentences(pieces) {
  const kept = pieces.filter((p) => lastText(p));
  return kept.flatMap((p, i) => {
    const ended = /[.?!]$/.test(lastText(p));
    return [p, i < kept.length - 1 ? (ended ? " " : ". ") : ended ? "" : "."];
  });
}

function structured(apiUrl, extra) {
  const blocks = [{ p: ["Structured data: ", url(apiUrl), " (free; docs ", url(DOCS), ")"] }];
  if (extra) blocks.push({ p: extra });
  return { heading: "Structured data", blocks };
}

function authorNames(authorships, k) {
  const names = authorships.map((a) => clean(a.author?.display_name || a.raw_author_name)).filter(Boolean);
  if (names.length <= k + 1) return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0] || "";
  return `${names.slice(0, k).join(", ")} and ${names.length - k} others`;
}

const venueOf = (w) => clean(w.primary_location?.source?.display_name) || null;

// One result line per entity type, with the fields its list request selects.
const ROW_COUNTS = (x) => (x.works_count !== undefined ? `${num(x.works_count)} works, cited by ${num(x.cited_by_count ?? 0)}` : "");
const GENERIC_SELECT = "id,display_name,works_count,cited_by_count";
const LIST = {
  works: {
    select: "id,display_name,publication_year,type,cited_by_count,doi,authorships,primary_location,open_access,is_retracted",
    row: (x, name) => [
      ...sentences([
        [name, x.publication_year ? ` (${x.publication_year})` : ""],
        x.authorships?.length ? authorNames(x.authorships, 3) : "",
        venueOf(x),
        `Cited by ${num(x.cited_by_count ?? 0)}`,
        x.open_access?.is_oa ? "Open access" : "",
        x.is_retracted ? "Retracted" : "",
      ]),
      x.doi ? [" ", url(x.doi)] : "",
    ],
  },
  authors: {
    select: "id,display_name,orcid,works_count,cited_by_count,last_known_institutions",
    row: (x, name) => {
      const inst = (x.last_known_institutions || [])[0];
      return [...sentences([[name, inst ? `, ${clean(inst.display_name)}${inst.country_code ? ` (${inst.country_code})` : ""}` : ""], ROW_COUNTS(x)]), x.orcid ? [" ORCID ", url(x.orcid)] : ""];
    },
  },
  sources: {
    select: "id,display_name,type,host_organization_name,issn_l,works_count,cited_by_count",
    row: (x, name) => sentences([[name, x.type ? ` (${x.type})` : "", x.host_organization_name ? `, ${clean(x.host_organization_name)}` : "", x.issn_l ? `, ISSN-L ${x.issn_l}` : ""], ROW_COUNTS(x)]),
  },
  institutions: {
    select: "id,display_name,type,country_code,geo,works_count,cited_by_count",
    row: (x, name) => {
      const about = [x.type, [x.geo?.city, x.country_code].filter(Boolean).join(", ")].filter(Boolean).join(", ");
      return sentences([[name, about ? ` (${about})` : ""], ROW_COUNTS(x)]);
    },
  },
  topics: {
    select: "id,display_name,subfield,field,works_count,cited_by_count",
    row: (x, name) => sentences([[name, x.subfield ? ` (subfield ${clean(x.subfield.display_name)}; field ${clean(x.field?.display_name)})` : ""], ROW_COUNTS(x)]),
  },
  // continents and awards have no works_count to select; they fetch whole records
  ...Object.fromEntries(["funders", "publishers", "keywords", "subfields", "fields", "domains", "countries", "concepts", "sdgs", "languages"].map((t) => [t, { select: GENERIC_SELECT }])),
};

export const listSelect = (type) => LIST[type]?.select;

function listRow(type, x) {
  const name = link(x.display_name || x.title || shortId(x.id), siteUrl(x.id));
  return LIST[type]?.row ? LIST[type].row(x, name) : sentences([name, ROW_COUNTS(x)]);
}

function sortLabel(sort) {
  if (sort.startsWith("relevance_score")) return "relevance";
  const [field, dir] = sort.split(":");
  return `${field.replace(/_/g, " ")}${dir === "asc" ? ", lowest first" : ", highest first"}`;
}

export function listPage(r, pageUrl, data, apiUrl) {
  const { type, query: q } = r;
  const count = data.meta?.count ?? 0;
  const results = data.results || [];
  const from = (r.page - 1) * q.per_page + 1;
  const to = from + results.length - 1;
  const searchText = r.searchKey ? q[r.searchKey] : null;
  const matches = count === 1 ? `1 ${SINGULAR[type]} matches` : `${num(count)} ${type} match`;
  const sections = [{
    heading: "Query",
    blocks: [facts([
      ...(r.searchKey ? [[SEARCH_LABEL[r.searchKey], searchText]] : []),
      ["Filter", q.filter ? { code: q.filter } : null],
      ["Sort", sortLabel(q.sort)],
      ["Results", num(count)],
      ["Same list in the API", url(apiUrl)],
    ])],
  }];
  if (results.length) {
    const blocks = [{ ol: results.map((x) => listRow(type, x)), start: from }];
    if (to < count && r.page < 10000) {
      const next = new URL(pageUrl.href);
      next.searchParams.set("page", String(r.page + 1));
      blocks.push({ p: ["Next page: ", url(next.href)] });
    }
    sections.push({ heading: "Results", blocks });
  }
  sections.push(structured(apiUrl));
  return {
    title: `${cap(type)}${searchText ? `: "${searchText}"` : q.filter ? " (filtered)" : ""}`,
    canonical: pageUrl.href,
    apiUrl,
    intro: results.length
      ? `${matches}. This page lists ${num(from)} to ${num(to)}, sorted by ${sortLabel(q.sort)}.`
      : `No ${type} match${r.page > 1 ? " on this page" : ""}.`,
    sections,
  };
}

export function errorPage(r, pageUrl, err) {
  const what = `this ${r.type} list`;
  const reason = err.message.length > 300 ? `${err.message.slice(0, 300)}...` : err.message;
  const notFound = err.status === 404;
  const intro = notFound
    ? `OpenAlex has no ${what}.`
    : err.status === 400
      ? sentences([`The OpenAlex API could not run ${what}: ${reason}`])
      : `The OpenAlex API did not answer for ${what} just now (${err.message}). Try again in a moment.`;
  return {
    title: notFound ? "Not found" : "Could not load this page",
    canonical: pageUrl.href,
    apiUrl: notFound ? undefined : err.apiUrl,
    intro,
    sections: !notFound && err.apiUrl ? [structured(err.apiUrl)] : [],
  };
}
