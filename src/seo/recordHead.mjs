// Record pages: the one map from an OpenAlex record to its <head> (oxjob #1689).
//
// EntityPage.vue calls recordHead() through useHead, so the server render (what
// search engines and AI fetchers read) and the browser app produce the same
// title, description, canonical, link-preview tags, robots meta and JSON-LD from
// the same code: they can't drift. Company pages have their own map
// (companyPages.mjs, #1486).
//
// Plain ESM importing only its sibling, like companyPages.mjs, so Node code can load it too.
// Descriptions: claim first, factual, no em dashes, at most ~160 characters.

import { noindexReason } from './indexable.mjs';

const SITE_URL = 'https://openalex.org';
const SITE_NAME = 'OpenAlex';
const SHARE_IMAGE = `${SITE_URL}/brand-assets/openalex-mark-square.png`;
export const DESCRIPTION_MAX = 160;
// JSON-LD lists stay bounded: a physics paper can have 3,000 authors.
const MAX_LD_AUTHORS = 100;

// One-letter id prefix -> the website's path for that entity type.
const NATIVE = { W: 'works', A: 'authors', S: 'sources', I: 'institutions', P: 'publishers', F: 'funders', C: 'concepts', T: 'topics', G: 'awards' };

const SINGULAR = {
  works: 'work', authors: 'author', sources: 'source', institutions: 'institution', publishers: 'publisher',
  funders: 'funder', concepts: 'concept', topics: 'topic', awards: 'grant', keywords: 'keyword',
  subfields: 'subfield', fields: 'field', domains: 'domain', sdgs: 'sustainable development goal',
  countries: 'country', continents: 'continent', languages: 'language', types: 'work type',
  'source-types': 'source type', 'institution-types': 'institution type', licenses: 'license',
  'oa-statuses': 'open access status', indexes: 'index', 'source-lists': 'source list',
  'study-designs': 'study design', locations: 'location',
};

const INSTITUTION_TYPES = {
  education: 'Educational institution', healthcare: 'Healthcare institution', company: 'Company',
  government: 'Government institution', nonprofit: 'Nonprofit', facility: 'Research facility',
  archive: 'Archive', funder: 'Funder', other: 'Institution',
};
const INSTITUTION_LD_TYPES = {
  education: 'CollegeOrUniversity', company: 'Corporation', government: 'GovernmentOrganization', nonprofit: 'NGO',
};

// ---------- small text helpers ----------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' };

// Display names carry markup (<i>, <sub>, <scp>) and entities; heads want plain text.
export function plain(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim();
}

function num(x) {
  return typeof x === 'number' ? Math.round(x).toLocaleString('en-US') : '';
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const plural = (n, word) => `${num(n)} ${word}${n === 1 ? '' : 's'}`;
const tail = (u) => String(u ?? '').replace(/\/+$/, '').split('/').pop();

let regionNames = null;
function countryName(code) {
  if (!code) return '';
  try {
    regionNames = regionNames || new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(String(code).toUpperCase()) || code;
  } catch {
    return code;
  }
}

// Cut at a word boundary and mark the cut.
function truncate(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, '')}…`;
}

// Required parts, then optional parts in priority order while they fit; "; " between.
function fit(required, optional = [], max = DESCRIPTION_MAX) {
  let text = required.filter(Boolean).join('; ');
  for (const part of optional.filter(Boolean)) {
    const next = text ? `${text}; ${part}` : part;
    if (next.length <= max) text = next;
  }
  return truncate(text, max);
}

// "Heather Piwowar" -> "Piwowar"; "Piwowar, Heather" -> "Piwowar"; "Martin Luther King Jr." -> "King".
export function surname(name) {
  const n = plain(name);
  if (n.includes(',')) return n.split(',')[0].trim();
  const parts = n.split(' ').filter(Boolean);
  while (parts.length > 1 && /^(jr|sr|ii|iii|iv|phd|md)\.?$/i.test(parts.at(-1))) parts.pop();
  return parts.at(-1) || '';
}

// "Piwowar, Priem, Larivière and 6 others"; "Piwowar and Priem"; "Piwowar".
function byline(names, k) {
  if (!names.length || k < 1) return '';
  if (names.length <= k) return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  const rest = names.length - k;
  return `${names.slice(0, k).join(', ')} and ${num(rest)} other${rest === 1 ? '' : 's'}`;
}

// ---------- URLs ----------

function shortId(id) {
  return String(id ?? '').replace(/^https?:\/\/(www\.)?openalex\.org\//i, '');
}

// The record's one URL: https://openalex.org/works/W123 (long form, upper-case id),
// or https://openalex.org/keywords/kelp for namespaced ids. Built from the record's
// own id, so a merged id's page points at the record it was merged into, and query
// strings (?utm_source=chatgpt.com) never reach it.
export function canonicalUrl(recordOrId) {
  const id = typeof recordOrId === 'object' && recordOrId !== null ? recordOrId.id : recordOrId;
  const s = shortId(id);
  const m = s.match(/^([a-z])(\d+)$/i);
  if (m && NATIVE[m[1].toUpperCase()]) return `${SITE_URL}/${NATIVE[m[1].toUpperCase()]}/${m[1].toUpperCase()}${m[2]}`;
  if (/^[a-z][a-z-]*\/[^/?#]+$/i.test(s) && !/^https?:/i.test(s)) return `${SITE_URL}/${s}`;
  return null;
}

// The record in the API: https://api.openalex.org/works/W123, .../keywords/kelp.
// Same id rules as canonicalUrl (the record's own id, never the request's).
export const API_URL = 'https://api.openalex.org';
export function apiUrl(recordOrId) {
  const canonical = canonicalUrl(recordOrId);
  return canonical ? API_URL + canonical.slice(SITE_URL.length) : null;
}

// The DOI without its resolver: "10.7717/peerj.4375", or '' when there is none.
export function bareDoi(doi) {
  const s = String(doi ?? '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:/i, '');
  return /^10\.\S+\/\S+/.test(s) ? s : '';
}

// ---------- titles ----------

export function recordName(type, r) {
  if (!r) return '';
  if (type === 'locations') return plain(r.title) || shortId(r.id);
  return plain(r.display_name) || plain(r.title) || plain(r.funder_award_id) || shortId(r.id);
}

export function recordTitle(type, r) {
  const name = recordName(type, r);
  return name ? `${name} | ${SITE_NAME}` : SITE_NAME;
}

// ---------- descriptions ----------

function workDescription(w) {
  const type = (w.type || 'work').replace(/-/g, ' ');
  const head = cap(w.publication_year ? `${w.publication_year} ${type}` : type);
  const venue = plain(w.primary_location?.source?.display_name);
  const names = (w.authorships || []).map((a) => surname(a.author?.display_name || a.raw_author_name)).filter(Boolean);
  const facts = [
    w.is_retracted ? 'retracted' : '',
    w.cited_by_count ? plural(w.cited_by_count, 'citation') : '',
    w.open_access?.is_oa ? 'open access' : '',
  ].filter(Boolean);
  // Fewer names first, then drop the venue, until it fits.
  const candidates = [];
  for (const withVenue of venue ? [true, false] : [false]) {
    for (const k of [3, 2, 1]) {
      const by = byline(names, k);
      candidates.push([`${head}${withVenue ? ` in ${venue}` : ''}${by ? ` by ${by}` : ''}`, ...facts].join('; '));
    }
  }
  return candidates.find((c) => c.length <= DESCRIPTION_MAX) || truncate(candidates.at(-1), DESCRIPTION_MAX);
}

function institutionPlace(i) {
  const country = i?.geo?.country || countryName(i?.country_code);
  return [i?.geo?.city, country].filter(Boolean).join(', ');
}

function countsText(r) {
  const parts = [];
  if (typeof r.works_count === 'number') parts.push(plural(r.works_count, 'work'));
  if (r.cited_by_count) parts.push(plural(r.cited_by_count, 'citation'));
  return parts.join(', ');
}

function authorDescription(a) {
  const lki = (a.last_known_institutions || []).map((i) => plain(i.display_name)).filter(Boolean);
  const head = `Author${lki.length ? ` at ${lki.slice(0, 2).join(' and ')}` : ''}`;
  const counts = countsText(a);
  const topics = (a.topics || []).slice(0, 3).map((t) => plain(t.display_name)).filter(Boolean);
  return fit([`${head}${counts ? ` with ${counts.replace(', ', ' and ')}` : ''}`], [
    a.orcid ? `ORCID ${tail(a.orcid)}` : '',
    a.summary_stats?.h_index ? `h-index ${a.summary_stats.h_index}` : '',
    topics.length ? `topics: ${topics.join(', ')}` : '',
    topics.length > 1 ? `topics: ${topics.slice(0, 2).join(', ')}` : '',
    topics.length ? `topic: ${topics[0]}` : '',
  ]);
}

function sourceDescription(s) {
  const type = (s.type || 'source').replace(/-/g, ' ');
  const publisher = plain(s.host_organization_name);
  return fit([`${cap(type)}${publisher ? ` published by ${publisher}` : ''}`], [
    countsText(s),
    s.issn_l ? `ISSN ${s.issn_l}` : '',
    s.is_oa ? 'fully open access' : '',
    s.is_in_doaj ? 'in DOAJ' : '',
  ]);
}

function institutionDescription(i) {
  const place = institutionPlace(i);
  const acronyms = (i.display_name_acronyms || []).map(plain).filter(Boolean);
  return fit([`${INSTITUTION_TYPES[i.type] || 'Institution'}${place ? ` in ${place}` : ''}`], [
    countsText(i),
    acronyms.length ? `also known as ${acronyms[0]}` : '',
    i.ror ? `ROR ${tail(i.ror)}` : '',
  ]);
}

function funderDescription(f) {
  const country = countryName(f.country_code);
  const description = plain(f.description);
  return fit([`Research funder${country ? ` in ${country}` : ''}`], [
    typeof f.works_count === 'number' ? plural(f.works_count, 'funded work') : '',
    f.awards_count ? plural(f.awards_count, 'grant') : '',
    description && description.length < 90 ? description : '',
    f.ids?.ror ? `ROR ${tail(f.ids.ror)}` : '',
  ]);
}

function publisherDescription(p) {
  const countries = (p.country_codes || []).map(countryName).filter(Boolean);
  const parent = plain(p.parent_publisher?.display_name ?? '');
  return fit([`Publisher${countries.length ? ` in ${countries.slice(0, 2).join(' and ')}` : ''}`], [
    countsText(p),
    parent ? `part of ${parent}` : '',
  ]);
}

// Topics, keywords, concepts and the like: the facts, then their own description, cut to fit.
function termDescription(type, r) {
  const where = [plain(r.subfield?.display_name), plain(r.field?.display_name)].filter(Boolean).join(', ');
  const counts = countsText(r).replace(', ', ' and ');
  const head = `${cap(SINGULAR[type] || 'entity')}${where ? ` in ${where}` : ''}`;
  const facts = truncate(counts ? `${head}${where ? ',' : ''} with ${counts}` : head, DESCRIPTION_MAX);
  const description = plain(r.description);
  if (!description) return facts;
  const room = DESCRIPTION_MAX - facts.length - 2;
  return room > 40 ? `${facts}. ${truncate(description, room)}` : facts;
}

export function recordDescription(type, r) {
  if (!r) return '';
  switch (type) {
    case 'works': return workDescription(r);
    case 'authors': return authorDescription(r);
    case 'sources': return sourceDescription(r);
    case 'institutions': return institutionDescription(r);
    case 'funders': return funderDescription(r);
    case 'publishers': return publisherDescription(r);
    default: return termDescription(type, r);
  }
}

// ---------- JSON-LD ----------

const compact = (o) => {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) delete o[k];
  }
  return o;
};
const ref = (r, extra = {}) => (r?.id || r?.display_name ? compact({ name: plain(r.display_name) || undefined, url: canonicalUrl(r) || undefined, ...extra }) : undefined);
const urls = (...xs) => [...new Set(xs.flat().filter((x) => typeof x === 'string' && /^https?:\/\//.test(x)))];
const wikidataUrl = (q) => (!q ? null : /^https?:/.test(q) ? q.replace('/wiki/', '/entity/') : `https://www.wikidata.org/entity/${q}`);
const openalexIdentifier = (r) => ({ '@type': 'PropertyValue', propertyID: 'OpenAlex', value: shortId(r.id) });

function organizationLd(i, type = 'Organization') {
  if (!i) return undefined;
  return compact({
    '@type': type,
    ...ref(i),
    sameAs: urls(i.ror),
    address: i.country_code ? { '@type': 'PostalAddress', addressCountry: i.country_code } : undefined,
  });
}

const WORK_LD_TYPES = { book: 'Book', 'book-chapter': 'Chapter', dissertation: 'Thesis', dataset: 'Dataset', software: 'SoftwareSourceCode' };

function workLd(w, canonical, abstract) {
  const doi = w.doi ? String(w.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : '';
  const src = w.primary_location?.source;
  const authorships = w.authorships || [];
  let ldType = WORK_LD_TYPES[w.type] || 'ScholarlyArticle';
  // Google's Dataset type requires a description; without one a dataset is a plain CreativeWork.
  if (ldType === 'Dataset' && !abstract) ldType = 'CreativeWork';
  const name = recordName('works', w);
  return compact({
    '@context': 'https://schema.org',
    '@type': ldType,
    '@id': canonical,
    url: canonical,
    name,
    headline: name.length <= 110 ? name : undefined,
    datePublished: w.publication_date || (w.publication_year ? String(w.publication_year) : undefined),
    inLanguage: w.language || undefined,
    abstract: abstract || undefined,
    author: authorships.slice(0, MAX_LD_AUTHORS).map((a) => compact({
      '@type': 'Person',
      name: plain(a.author?.display_name || a.raw_author_name),
      url: canonicalUrl(a.author) || undefined,
      sameAs: urls(a.author?.orcid),
      affiliation: (a.institutions || []).map((i) => organizationLd(i)),
    })),
    isPartOf: src ? compact({
      '@type': src.type === 'journal' ? 'Periodical' : 'CreativeWorkSeries',
      ...ref(src),
      issn: src.issn?.length ? src.issn : undefined,
      publisher: src.host_organization_name ? compact({ '@type': 'Organization', name: plain(src.host_organization_name), url: canonicalUrl(src.host_organization) || undefined }) : undefined,
    }) : undefined,
    identifier: [
      doi ? { '@type': 'PropertyValue', propertyID: 'DOI', value: doi } : null,
      w.ids?.pmid ? { '@type': 'PropertyValue', propertyID: 'PMID', value: tail(w.ids.pmid) } : null,
      w.ids?.pmcid ? { '@type': 'PropertyValue', propertyID: 'PMCID', value: tail(w.ids.pmcid) } : null,
      openalexIdentifier(w),
    ].filter(Boolean),
    sameAs: urls(doi ? `https://doi.org/${doi}` : null, w.ids?.pmid),
    isAccessibleForFree: w.open_access ? !!w.open_access.is_oa : undefined,
    about: (w.topics || []).slice(0, 3).map((t) => compact({ '@type': 'DefinedTerm', name: plain(t.display_name), url: canonicalUrl(t) || undefined })),
    keywords: (w.keywords || []).map((k) => plain(k.display_name)).filter(Boolean).join(', ') || undefined,
    funder: (w.funders || []).map((f) => compact({ '@type': 'Organization', ...ref(f) })),
    interactionStatistic: w.cited_by_count ? { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CiteAction', userInteractionCount: w.cited_by_count } : undefined,
  });
}

function authorLd(a, canonical) {
  const name = recordName('authors', a);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': canonical,
    url: canonical,
    name,
    alternateName: (a.display_name_alternatives || []).map(plain).filter((n) => n && n !== name).slice(0, 10),
    sameAs: urls(a.orcid, a.ids?.scopus, a.ids?.wikipedia),
    identifier: [a.orcid ? { '@type': 'PropertyValue', propertyID: 'ORCID', value: tail(a.orcid) } : null, openalexIdentifier(a)].filter(Boolean),
    affiliation: (a.last_known_institutions || []).map((i) => organizationLd(i)),
    knowsAbout: (a.topics || []).slice(0, 5).map((t) => compact({ '@type': 'DefinedTerm', name: plain(t.display_name), url: canonicalUrl(t) || undefined })),
  });
}

function sourceLd(s, canonical) {
  return compact({
    '@context': 'https://schema.org',
    '@type': s.type === 'journal' ? 'Periodical' : 'CreativeWorkSeries',
    '@id': canonical,
    url: canonical,
    name: recordName('sources', s),
    alternateName: (s.alternate_titles || []).map(plain).filter(Boolean).slice(0, 10),
    issn: s.issn?.length ? s.issn : undefined,
    publisher: s.host_organization_name ? compact({ '@type': 'Organization', name: plain(s.host_organization_name), url: canonicalUrl(s.host_organization) || undefined }) : undefined,
    sameAs: urls(s.homepage_url, wikidataUrl(s.ids?.wikidata)),
    identifier: [s.issn_l ? { '@type': 'PropertyValue', propertyID: 'ISSN-L', value: s.issn_l } : null, openalexIdentifier(s)].filter(Boolean),
    isAccessibleForFree: typeof s.is_oa === 'boolean' ? s.is_oa : undefined,
  });
}

function orgLd(type, r, canonical) {
  const ldType = type === 'institutions' ? INSTITUTION_LD_TYPES[r.type] || 'Organization' : 'Organization';
  const ids = r.ids || {};
  return compact({
    '@context': 'https://schema.org',
    '@type': ldType,
    '@id': canonical,
    url: canonical,
    name: recordName(type, r),
    alternateName: [...(r.display_name_acronyms || []), ...(r.display_name_alternatives || r.alternate_titles || [])].map(plain).filter(Boolean).slice(0, 10),
    description: plain(r.description) || undefined,
    sameAs: urls(r.ror || ids.ror, r.homepage_url, ids.wikipedia, wikidataUrl(ids.wikidata)),
    identifier: [
      (r.ror || ids.ror) ? { '@type': 'PropertyValue', propertyID: 'ROR', value: tail(r.ror || ids.ror) } : null,
      ids.doi ? { '@type': 'PropertyValue', propertyID: 'Crossref Funder ID', value: tail(ids.doi) } : null,
      openalexIdentifier(r),
    ].filter(Boolean),
    address: r.geo?.country_code || r.country_code ? compact({
      '@type': 'PostalAddress',
      addressLocality: r.geo?.city || undefined,
      addressRegion: r.geo?.region || undefined,
      addressCountry: r.geo?.country_code || r.country_code,
    }) : undefined,
    parentOrganization: type === 'publishers' && r.parent_publisher?.id ? compact({ '@type': 'Organization', ...ref(r.parent_publisher) }) : undefined,
  });
}

function termLd(type, r, canonical) {
  const set = { topics: 'OpenAlex topics', keywords: 'OpenAlex keywords', concepts: 'OpenAlex concepts', subfields: 'OpenAlex subfields', fields: 'OpenAlex fields', domains: 'OpenAlex domains' }[type];
  if (!set) return null;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': canonical,
    url: canonical,
    name: recordName(type, r),
    description: plain(r.description) || undefined,
    termCode: shortId(r.id),
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: set, url: `${SITE_URL}/${type}` },
    sameAs: urls(r.ids?.wikipedia, wikidataUrl(r.ids?.wikidata)),
  });
}

export function recordJsonLd(type, r, { abstract } = {}) {
  if (!r) return null;
  const canonical = canonicalUrl(r);
  if (!canonical) return null;
  switch (type) {
    case 'works': return workLd(r, canonical, abstract);
    case 'authors': return authorLd(r, canonical);
    case 'sources': return sourceLd(r, canonical);
    case 'institutions': case 'funders': case 'publishers': return orgLd(type, r, canonical);
    default: return termLd(type, r, canonical);
  }
}

// JSON for a <script> body: "</script>" and "<!--" can't appear in it.
export function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

// ---------- the head ----------

// The useHead() input for a record page. `abstract` is the plain abstract the page
// shows (works: open access only, as the site does today), or ''.
export function recordHead(type, record, { abstract = '' } = {}) {
  if (!record) return {};
  const title = recordTitle(type, record);
  const name = recordName(type, record);
  const description = recordDescription(type, record);
  const canonical = canonicalUrl(record);
  const api = apiUrl(record);
  const robots = noindexReason(type, record) ? 'noindex' : null;
  const ld = recordJsonLd(type, record, { abstract });
  const meta = [
    { name: 'description', content: description },
    robots ? { name: 'robots', content: robots } : null,
    { property: 'og:type', content: type === 'works' ? 'article' : type === 'authors' ? 'profile' : 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: name },
    { property: 'og:description', content: description },
    canonical ? { property: 'og:url', content: canonical } : null,
    { property: 'og:image', content: SHARE_IMAGE },
    type === 'works' && record.publication_date ? { property: 'article:published_time', content: record.publication_date } : null,
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: name },
    { name: 'twitter:description', content: description },
  ].filter(Boolean);
  return {
    title,
    titleTemplate: null,
    meta,
    // The same record as JSON, for agents and scripts that read the head (#1689).
    link: [
      canonical ? { rel: 'canonical', href: canonical } : null,
      api ? { rel: 'alternate', type: 'application/json', href: api } : null,
    ].filter(Boolean),
    script: ld ? [{ type: 'application/ld+json', key: 'record-jsonld', innerHTML: jsonForScript(ld) }] : [],
  };
}
