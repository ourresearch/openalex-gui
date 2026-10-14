// oxjob #1688: what each assistant page says, as a page model (format.mjs writes it out).
// Plain and factual: the record's main facts, links an assistant can follow (each is
// another readable page), and the API URL for structured data.

import { clean } from "./format.mjs";

const SITE = "https://openalex.org";
export const API = "https://api.openalex.org";
const DOCS = "https://help.openalex.org/llms.txt";
const MAX_AUTHORS = 20;

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

// The works filter that lists an entity's works, where it can be known before the record arrives
// (funders and publishers carry no works_api_url). Other types read it from works_api_url.
const WORKS_FILTER = {
  authors: "author.id",
  sources: "primary_location.source.id",
  institutions: "institutions.id",
  topics: "topics.id",
  funders: "funders.id",
  publishers: "primary_location.source.publisher_lineage",
};

export function knownWorksFilter(type, id) {
  return WORKS_FILTER[type] ? `${WORKS_FILTER[type]}:${id}` : null;
}

// The works filter in a record's works_api_url (keywords, subfields, countries, ...), or null.
export function worksFilterOf(record) {
  try {
    return record.works_api_url ? new URL(record.works_api_url).searchParams.get("filter") : null;
  } catch {
    return null;
  }
}

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

const apiUrlOf = (apiId) => API + siteUrl(apiId).slice(SITE.length);
const worksListUrl = (filter) => `${SITE}/works?filter=${filter}`;

// "https://orcid.org/0000-0003-1613-5981" -> "0000-0003-1613-5981"; same for PMID and PMCID URLs.
function shortTail(u) {
  return String(u).replace(/\/+$/, "").split("/").pop();
}

function facts(rows) {
  return { facts: rows.filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) };
}

const joinInline = (items, sep = "; ") => items.flatMap((x, i) => (i ? [sep, x] : [x]));

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

// The words of an abstract from the API's inverted index, as the website rebuilds them (util.js unravel).
export function abstractText(inv) {
  if (!inv || typeof inv !== "object") return "";
  const words = [];
  for (const [word, positions] of Object.entries(inv)) for (const p of positions) words[p] = word;
  return words.filter((w) => w !== undefined).join(" ").replace(/^\s*abstract\b[:.\s]*/i, "").trim();
}

function authorNames(authorships, k) {
  const names = authorships.map((a) => clean(a.author?.display_name || a.raw_author_name)).filter(Boolean);
  if (names.length <= k + 1) return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0] || "";
  return `${names.slice(0, k).join(", ")} and ${names.length - k} others`;
}

function institutionText(i) {
  return [link(i.display_name, siteUrl(i.id)), i.country_code ? ` (${i.country_code})` : ""];
}

// Most recent years first; the API's order varies by entity type, and some carry year 10000.
function worksPerYear(countsByYear) {
  const thisYear = new Date().getUTCFullYear();
  const rows = (countsByYear || []).filter((y) => y.year <= thisYear).sort((a, b) => b.year - a.year).slice(0, 5);
  return rows.length ? rows.map((y) => `${y.year}: ${num(y.works_count)}`).join("; ") : null;
}

function topicsText(topics, k = 5) {
  const shown = (topics || []).slice(0, k);
  return shown.length ? joinInline(shown.map((t) => [link(t.display_name, siteUrl(t.id)), t.count ? ` (${num(t.count)} works)` : ""])) : null;
}

function alsoKnownAs(record, k = 6) {
  const names = [...(record.display_name_acronyms || []), ...(record.display_name_alternatives || record.alternate_titles || [])]
    .map(clean)
    .filter((x) => x && x !== clean(record.display_name));
  return names.length ? [...new Set(names)].slice(0, k).join("; ") : null;
}

const venueOf = (w) => clean(w.primary_location?.source?.display_name) || null;

// The two rows every entity with works has, pointing at the same list the most-cited section draws from.
function worksRows(record, filter) {
  return [
    ["Works", record.works_count === undefined ? null : filter ? [`${num(record.works_count)}: `, url(worksListUrl(filter))] : num(record.works_count)],
    ["Cited by", num(record.cited_by_count)],
  ];
}

function topWorksSection(top, filter) {
  const rows = top?.results || [];
  if (!rows.length) return null;
  return {
    heading: `Most-cited works (top ${rows.length})`,
    blocks: [
      {
        ol: rows.map((w) => sentences([
          [link(w.display_name || "Untitled", siteUrl(w.id)), w.publication_year ? ` (${w.publication_year})` : "", venueOf(w) ? `, ${venueOf(w)}` : ""],
          `Cited by ${num(w.cited_by_count ?? 0)}`,
        ])),
      },
      { p: ["All works: ", url(worksListUrl(filter))] },
    ],
  };
}

// Facts, then any type-specific sections, then the most-cited works and the structured-data pointer.
function entityShell(record, { intro, rows, filter, top, extra = [] }) {
  const apiUrl = apiUrlOf(record.id);
  const sections = [{ heading: "Facts", blocks: [facts(rows)] }, ...extra];
  const topSection = filter ? topWorksSection(top, filter) : null;
  if (topSection) sections.push(topSection);
  sections.push(structured(apiUrl, filter ? ["Its works in the API: ", url(`${API}/works?filter=${filter}`)] : null));
  return { title: record.display_name || record.title || shortId(record.id), canonical: siteUrl(record.id), apiUrl, intro, sections };
}

function workPage(w) {
  const id = shortId(w.id);
  const src = w.primary_location?.source;
  const oa = w.open_access || {};
  const best = w.best_oa_location;
  const oaUrl = best?.pdf_url || best?.landing_page_url || oa.oa_url;
  const b = w.biblio || {};
  const pages = b.first_page ? (b.last_page && b.last_page !== b.first_page ? `pages ${b.first_page}-${b.last_page}` : `page ${b.first_page}`) : null;
  const biblio = [b.volume && `volume ${b.volume}`, b.issue && `issue ${b.issue}`, pages].filter(Boolean).join(", ");
  const authorships = w.authorships || [];
  const byLine = authorships.length ? authorNames(authorships, 3) : null;
  const pt = w.primary_topic;
  const otherTopics = (w.topics || []).filter((t) => t.id !== pt?.id);
  const cnp = w.citation_normalized_percentile;
  const impact = [
    cnp?.is_in_top_1_percent ? "in the top 1% most cited for its field and year" : cnp?.is_in_top_10_percent ? "in the top 10% most cited for its field and year" : null,
    typeof w.fwci === "number" ? `field-weighted citation impact ${w.fwci.toFixed(2)}` : null,
  ].filter(Boolean).join("; ");
  const otherIds = [w.ids?.pmid && `PMID ${shortTail(w.ids.pmid)}`, w.ids?.pmcid && `PMCID ${shortTail(w.ids.pmcid)}`].filter(Boolean).join("; ");

  const rows = [
    ["Retracted", w.is_retracted ? "yes" : null],
    ["Authors", byLine],
    ["Year", w.publication_year],
    ["Publication date", w.publication_date],
    ["Type", w.type],
    ["Source", src ? [link(src.display_name, siteUrl(src.id)), src.type ? ` (${src.type})` : "", src.host_organization_name ? `, published by ${clean(src.host_organization_name)}` : "", biblio ? `; ${biblio}` : ""] : null],
    ["DOI", url(w.doi)],
    ["Open access", oa.is_oa ? [`yes (${oa.oa_status})`, oaUrl ? ["; best open copy: ", url(oaUrl)] : "", best?.license ? `; license ${best.license}` : ""] : `no${oa.oa_status ? ` (${oa.oa_status})` : ""}`],
    ["Cited by", [`${num(w.cited_by_count ?? 0)} works: `, url(worksListUrl(`cites:${id}`))]],
    ["References", w.referenced_works_count ? [`${num(w.referenced_works_count)} works: `, url(worksListUrl(`cited_by:${id}`))] : null],
    ["Related works", w.related_works?.length ? [`${w.related_works.length} works: `, url(worksListUrl(`related_to:${id}`))] : null],
    ["Citation impact", impact || null],
    ["Primary topic", pt ? [link(pt.display_name, siteUrl(pt.id)), ` (subfield ${clean(pt.subfield?.display_name)}; field ${clean(pt.field?.display_name)}; domain ${clean(pt.domain?.display_name)})`] : null],
    ["Other topics", otherTopics.length ? joinInline(otherTopics.map((t) => link(t.display_name, siteUrl(t.id)))) : null],
    ["Keywords", (w.keywords || []).slice(0, 8).map((k) => clean(k.display_name)).join("; ") || null],
    ["Funders", (w.funders || []).map((f) => clean(f.display_name)).join("; ") || null],
    ["Language", w.language],
    ["Other IDs", otherIds || null],
  ];

  const intro = sentences([
    [cap(w.type || "work"), w.publication_year ? ` published in ${w.publication_year}` : "", src ? [" in ", clean(src.display_name)] : "", byLine ? `, by ${byLine}` : ""],
    `OpenAlex ID ${id}`,
  ]);

  const extra = [];
  if (authorships.length) {
    const blocks = [{
      ol: authorships.slice(0, MAX_AUTHORS).map((a) => [
        link(a.author?.display_name || a.raw_author_name || "Unknown author", siteUrl(a.author?.id)),
        a.author?.orcid ? `, ORCID ${shortTail(a.author.orcid)}` : "",
        a.institutions?.length ? [": ", joinInline(a.institutions.map(institutionText))] : "",
        a.is_corresponding ? " (corresponding author)" : "",
      ]),
    }];
    if (authorships.length > MAX_AUTHORS) {
      blocks.push({ p: `And ${num(authorships.length - MAX_AUTHORS)} more authors; the API record lists them all.` });
    }
    extra.push({ heading: `Authors (${num(authorships.length)})`, blocks });
  }
  // The website shows the plain abstract only for open-access works (facetConfigs.js, key "abstract").
  const abstract = oa.is_oa ? abstractText(w.abstract_inverted_index) : "";
  if (abstract) extra.push({ heading: "Abstract", blocks: [{ p: abstract }] });
  return entityShell(w, { intro, rows, extra });
}

function authorPage(a, filter) {
  const id = shortId(a.id);
  const s = a.summary_stats || {};
  const lki = a.last_known_institutions || [];
  // Most recent first: the API lists affiliations in no useful order.
  const lastYear = (af) => Math.max(0, ...(af.years || []));
  const affiliations = [...(a.affiliations || [])].sort((x, y) => lastYear(y) - lastYear(x)).slice(0, 5).map((af) => {
    const years = [...(af.years || [])].sort((x, y) => x - y);
    const span = years.length ? (years[0] === years.at(-1) ? `${years[0]}` : `${years[0]}-${years.at(-1)}`) : "";
    return [...institutionText(af.institution || {}), span ? `, ${span}` : ""];
  });
  return {
    intro: sentences([["Author on OpenAlex (", id, ")", lki.length ? [", last known at ", joinInline(lki.map((i) => clean(i.display_name)), " and ")] : ""]]),
    rows: [
      ["ORCID", url(a.orcid)],
      ...worksRows(a, filter),
      ["h-index", s.h_index !== undefined ? `${s.h_index}; i10-index ${s.i10_index}` : null],
      ["Last known institution", lki.length ? joinInline(lki.map(institutionText)) : null],
      ["Affiliations", affiliations.length ? joinInline(affiliations) : null],
      ["Main topics", topicsText(a.topics)],
      ["Works per year", worksPerYear(a.counts_by_year)],
      ["Also published as", alsoKnownAs(a)],
    ],
  };
}

function sourcePage(s, filter) {
  const id = shortId(s.id);
  const ss = s.summary_stats || {};
  const years = s.first_publication_year ? `${s.first_publication_year}-${s.last_publication_year ?? ""}` : null;
  return {
    intro: sentences([[cap(s.type || "source"), " on OpenAlex (", id, ")", s.host_organization_name ? `, published by ${clean(s.host_organization_name)}` : ""]]),
    rows: [
      ["Type", s.type],
      ["Publisher", s.host_organization_name ? link(s.host_organization_name, siteUrl(s.host_organization)) : null],
      ["ISSN-L", s.issn_l],
      ["ISSN", (s.issn || []).join(", ") || null],
      ["Open access", s.is_oa === undefined ? null : s.is_oa ? "yes, all its works are open access" : "no"],
      ["In DOAJ", s.is_in_doaj ? `yes${s.is_in_doaj_since_year ? `, since ${s.is_in_doaj_since_year}` : ""}` : s.is_in_doaj === false ? "no" : null],
      ["Article processing charge", s.apc_usd ? `${num(s.apc_usd)} USD` : null],
      ...worksRows(s, filter),
      ["h-index", ss.h_index !== undefined ? `${ss.h_index}; 2-year mean citedness ${num(ss["2yr_mean_citedness"])}` : null],
      ["Years published", years],
      ["Country", s.country_code],
      ["Homepage", url(s.homepage_url)],
      ["Main topics", topicsText(s.topics)],
      ["Works per year", worksPerYear(s.counts_by_year)],
    ],
  };
}

function institutionPage(i, filter) {
  const id = shortId(i.id);
  const g = i.geo || {};
  const place = [g.city, g.region, g.country].filter(Boolean).map(clean).join(", ");
  const parents = (i.associated_institutions || []).filter((x) => x.relationship === "parent");
  return {
    intro: sentences([[cap(i.type || "institution"), " institution", place ? ` in ${place}` : "", ` on OpenAlex (${id})`]]),
    rows: [
      ["Type", i.type],
      ["Location", place || i.country_code],
      ["ROR", url(i.ror)],
      ["Homepage", url(i.homepage_url)],
      ["Part of", parents.length ? joinInline(parents.map(institutionText)) : null],
      ...worksRows(i, filter),
      ["h-index", i.summary_stats?.h_index],
      ["Main topics", topicsText(i.topics)],
      ["Works per year", worksPerYear(i.counts_by_year)],
      ["Also known as", alsoKnownAs(i)],
    ],
  };
}

function topicPage(t, filter) {
  const id = shortId(t.id);
  return {
    intro: sentences([[`Research topic on OpenAlex (${id})`, t.subfield ? `, in the subfield ${clean(t.subfield.display_name)}` : "", t.field ? ` (field ${clean(t.field.display_name)})` : ""]]),
    rows: [
      ["Description", clean(t.description) || null],
      ["Subfield", t.subfield ? link(t.subfield.display_name, siteUrl(t.subfield.id)) : null],
      ["Field", t.field ? link(t.field.display_name, siteUrl(t.field.id)) : null],
      ["Domain", t.domain ? link(t.domain.display_name, siteUrl(t.domain.id)) : null],
      ["Keywords", (t.keywords || []).slice(0, 10).map((k) => clean(k.display_name ?? k)).join("; ") || null],
      ...worksRows(t, filter),
      ["Wikipedia", url(t.ids?.wikipedia)],
    ],
  };
}

function funderPage(f, filter) {
  const id = shortId(f.id);
  return {
    intro: sentences([[`Funder on OpenAlex (${id})`, f.country_code ? `, based in ${f.country_code}` : ""]]),
    rows: [
      ["Description", clean(f.description) || null],
      ["Also known as", alsoKnownAs(f)],
      ["Country", f.country_code],
      ["Homepage", url(f.homepage_url)],
      ["ROR", url(f.ids?.ror)],
      ["Grants", f.awards_count ? num(f.awards_count) : null],
      ...worksRows(f, filter),
      ["h-index", f.summary_stats?.h_index],
      ["Works per year", worksPerYear(f.counts_by_year)],
    ],
  };
}

function publisherPage(p, filter) {
  const id = shortId(p.id);
  const parent = p.parent_publisher;
  return {
    intro: sentences([`Publisher on OpenAlex (${id})`]),
    rows: [
      ["Also known as", alsoKnownAs(p, 4)],
      ["Part of", parent ? (typeof parent === "string" ? link(shortId(parent), siteUrl(parent)) : link(parent.display_name, siteUrl(parent.id))) : null],
      ["Countries", (p.country_codes || []).join(", ") || null],
      ["Homepage", url(p.homepage_url)],
      ["ROR", url(p.ids?.ror)],
      ...worksRows(p, filter),
      ["h-index", p.summary_stats?.h_index],
      ["Its journals and other sources", url(`${SITE}/sources?filter=host_organization.id:${id}`)],
    ],
  };
}

// Keywords, subfields, fields, domains, countries, awards, ...: the essentials any record has.
function genericPage(r, filter, type) {
  return {
    intro: sentences([`${cap(SINGULAR[type])} on OpenAlex (${shortId(r.id)})`]),
    rows: [
      ["Description", clean(r.description) || null],
      ...["domain", "field", "subfield", "continent", "funder"]
        .filter((k) => r[k]?.display_name)
        .map((k) => [cap(k), link(r[k].display_name, siteUrl(r[k].id))]),
      ...worksRows(r, filter),
    ],
  };
}

const BUILDERS = { authors: authorPage, sources: sourcePage, institutions: institutionPage, topics: topicPage, funders: funderPage, publishers: publisherPage };

export function entityPage(type, record, top) {
  if (type === "works") return workPage(record);
  const filter = knownWorksFilter(type, shortId(record.id)) ?? worksFilterOf(record);
  const { intro, rows } = (BUILDERS[type] || genericPage)(record, filter, type);
  return entityShell(record, { intro, rows, filter, top });
}

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
  const what = r.kind === "entity" ? `${SINGULAR[r.type]} ${r.id}` : `this ${r.type} list`;
  const reason = err.message.length > 300 ? `${err.message.slice(0, 300)}...` : err.message;
  const intro = err.status === 404
    ? `OpenAlex has no ${what}.`
    : err.status === 400
      ? sentences([`The OpenAlex API could not run ${what}: ${reason}`])
      : `The OpenAlex API did not answer for ${what} just now (${err.message}). Try again in a moment.`;
  return {
    title: err.status === 404 ? "Not found" : "Could not load this page",
    canonical: pageUrl.href,
    apiUrl: err.apiUrl,
    intro,
    sections: err.apiUrl ? [structured(err.apiUrl)] : [],
  };
}
