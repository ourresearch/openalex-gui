// oxjob #1689: which openalex.org paths are server-rendered record pages, and how
// their ids are validated, canonicalized and turned into API requests.
//
// Pure module (no app imports): the Nitro record middleware (server/middleware/
// 02.records.ts) and the app (EntityPage.vue, filters.js) share it, so the server
// and the browser agree on what a record URL is.
//
// Rule: a server-side API URL is only ever built from a type in RECORD_TYPES and
// an id that passed that type's pattern. The visitor's query string never reaches
// the API.

// Native entities: one-letter prefix + digits (W123). Canonical form uppercase.
const NATIVE_PREFIX = {
    works: 'W',
    authors: 'A',
    sources: 'S',
    institutions: 'I',
    publishers: 'P',
    funders: 'F',
    concepts: 'C',
    topics: 'T',
    awards: 'G',
};
const PREFIX_TO_TYPE = Object.fromEntries(Object.entries(NATIVE_PREFIX).map(([t, p]) => [p, t]));

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const DIGITS = /^\d{1,6}$/;

// Every entity-page route in src/router (`/:entityType/:entityId`) except
// locations, whose ids are opaque namespaced strings (doi:10.1/x); those pages stay
// client-rendered. `filterKey` must equal entityConfigs[type].filterKey (a unit test
// checks): it is the works filter for the page's "top works" list.
export const RECORD_TYPES = {
    works: { filterKey: null },
    authors: { filterKey: 'authorships.author.id' },
    sources: { filterKey: 'primary_location.source.id' },
    institutions: { filterKey: 'authorships.institutions.lineage' },
    publishers: { filterKey: 'primary_location.source.host_organization_lineage' },
    funders: { filterKey: 'funders.id' },
    concepts: { filterKey: 'concepts.id' },
    topics: { filterKey: 'primary_topic.id' },
    awards: { filterKey: 'awards.id' },
    keywords: { idRe: SLUG, filterKey: 'keywords.id' },
    subfields: { idRe: DIGITS, filterKey: 'primary_topic.subfield.id' },
    fields: { idRe: DIGITS, filterKey: 'primary_topic.field.id' },
    domains: { idRe: DIGITS, filterKey: 'primary_topic.domain.id' },
    sdgs: { idRe: /^\d{1,2}$/, filterKey: 'sustainable_development_goals.id' },
    countries: { idRe: /^[a-z]{2}$/i, upper: true, filterKey: 'authorships.countries' },
    continents: { idRe: /^q\d{1,10}$/i, upper: true, filterKey: 'authorships.institutions.continent' },
    languages: { idRe: /^[a-z]{2,3}$/i, filterKey: 'language' },
    types: { idRe: SLUG, filterKey: 'type' },
    'source-types': { idRe: SLUG, filterKey: 'primary_location.source.type' },
    'institution-types': { idRe: SLUG, filterKey: 'authorships.institutions.type' },
    licenses: { idRe: SLUG, filterKey: 'best_oa_location.license' },
    'oa-statuses': { idRe: SLUG, filterKey: 'open_access.oa_status' },
    indexes: { idRe: SLUG, filterKey: 'indexed_in' },
    'source-lists': { idRe: SLUG, filterKey: 'primary_location.source.listed_in' },
    'study-designs': { idRe: SLUG, filterKey: 'study_designs.id' },
};
for (const [type, prefix] of Object.entries(NATIVE_PREFIX)) {
    RECORD_TYPES[type].idRe = new RegExp(`^${prefix}\\d{1,15}$`, 'i');
    RECORD_TYPES[type].upper = true;
}

export const RECORD_TYPE_NAMES = Object.keys(RECORD_TYPES);

const MAX_ID_LENGTH = 80;
const LONG_FORM = /^\/([a-z-]+)\/([^/]+)\/?$/;
const SHORT_FORM = /^\/([waspfictg])(\d{1,15})\/?$/i;

// The id as the API writes it (W123, US, Q15, machine-learning).
function canonicalId(type, id) {
    return RECORD_TYPES[type].upper ? id.toUpperCase() : id.toLowerCase();
}

/**
 * Parse a request path (no query string) into a record reference.
 * Returns null when the path is not a server-renderable record page.
 *   /works/W123, /works/w123, /W123, /keywords/machine-learning, /countries/us
 * -> { type, id, apiPath: 'works/W123', canonicalPath: '/works/W123', isShortForm }
 */
export function parseRecordPath(pathname) {
    if (typeof pathname !== 'string' || pathname.length > 200) return null;
    let type, rawId, isShortForm = false;
    const short = SHORT_FORM.exec(pathname);
    if (short) {
        type = PREFIX_TO_TYPE[short[1].toUpperCase()];
        rawId = short[1] + short[2];
        isShortForm = true;
    } else {
        const long = LONG_FORM.exec(pathname);
        if (!long) return null;
        type = long[1];
        rawId = long[2];
    }
    const cfg = Object.prototype.hasOwnProperty.call(RECORD_TYPES, type) ? RECORD_TYPES[type] : null;
    if (!cfg || rawId.length > MAX_ID_LENGTH || !cfg.idRe.test(rawId)) return null;
    const id = canonicalId(type, rawId);
    return {
        type,
        id,
        apiPath: `${type}/${id}`,
        canonicalPath: `/${type}/${id}`,
        isShortForm,
    };
}

/**
 * The id as a record page URL writes it (W123, US, machine-learning), for links:
 * record pages 301 any other case, so every internal link should use this.
 * Ids that aren't record ids come back unchanged.
 */
export function canonicalRecordId(type, shortId) {
    return parseRecordPath(`/${type}/${shortId}`)?.id ?? shortId;
}

/** True for paths under a record type's prefix (/works/..., /W123) that parseRecordPath rejected. */
export function isUnderRecordPrefix(pathname) {
    if (SHORT_FORM.test(pathname)) return true;
    const first = (pathname || '').split('/')[1];
    return Object.prototype.hasOwnProperty.call(RECORD_TYPES, first) && pathname.length > first.length + 2;
}

/**
 * The page path for a record id as the API returns it:
 *   https://openalex.org/W123 -> /works/W123
 *   https://openalex.org/keywords/machine-learning -> /keywords/machine-learning
 * Null when it isn't a known record id.
 */
export function pathFromApiId(apiId) {
    if (typeof apiId !== 'string') return null;
    const rest = apiId.replace(/^https?:\/\/openalex\.org\//i, '');
    const native = /^([WASPFICTG])(\d{1,15})$/.exec(rest);
    if (native) return `/${PREFIX_TO_TYPE[native[1]]}/${rest}`;
    const parsed = parseRecordPath('/' + rest);
    return parsed && !parsed.isShortForm ? `/${rest}` : null;
}

// The "top works" list a record page shows (EntityPage fetchWorksPage), as a fixed
// shape: 25 works, the fields SerpResultsListItem renders, and nothing else.
export const WORKS_LIST_PER_PAGE = 25;
export const WORKS_LIST_SELECT = 'id,display_name,publication_year,authorships,primary_location,cited_by_count,best_oa_location';

/**
 * { filterKey, sort } for a record page's works list, or null when the page has no
 * list (works, and component entities). Repository sources list works where the
 * repository appears in any location (needs the record's type).
 */
export function worksListPlan(type, record) {
    const cfg = RECORD_TYPES[type];
    if (!cfg || !cfg.filterKey) return null;
    let filterKey = cfg.filterKey;
    if (type === 'sources' && record?.type === 'repository') filterKey = 'locations.source.id';
    const sort = type === 'awards' ? 'publication_year:desc' : 'cited_by_count:desc';
    return { filterKey, sort };
}

/** API path + query for that list (id must come from parseRecordPath). */
export function worksListApiPath(plan, id) {
    const filter = `${plan.filterKey}:${encodeURIComponent(id)}`;
    return `works?filter=${filter}&sort=${plan.sort}&per_page=${WORKS_LIST_PER_PAGE}&select=${WORKS_LIST_SELECT}`;
}

// Keep only what a works list row (SerpResultsListItem) shows: title, year, first
// authors, source name, citations, PDF link. The author page's HTML was 515 KB with
// full records. WorkAuthorsString shows the first two names (raw_author_name, else
// author.display_name) and "et al." when there are more than two, so three entries
// carrying just the shown name render identically.
export function trimWorkForList(w) {
    if (!w || typeof w !== 'object') return w;
    return {
        id: w.id,
        display_name: w.display_name,
        publication_year: w.publication_year,
        cited_by_count: w.cited_by_count,
        authorships: (w.authorships || []).slice(0, 3).map((a) => ({
            raw_author_name: a?.raw_author_name || a?.author?.display_name || 'Unknown author',
        })),
        primary_location: w.primary_location?.source?.display_name
            ? { source: { display_name: w.primary_location.source.display_name } }
            : null,
        best_oa_location: w.best_oa_location?.pdf_url ? { pdf_url: w.best_oa_location.pdf_url } : null,
    };
}

export function trimWorksList(resp) {
    if (!resp || !Array.isArray(resp.results)) return null;
    return {
        meta: { count: resp.meta?.count ?? resp.results.length, page: 1, per_page: WORKS_LIST_PER_PAGE },
        results: resp.results.map(trimWorkForList),
    };
}
