import axios from "axios";
import * as openalexId from "@/openalexId";

/**
 * Local autocomplete for the small closed vocabularies (oxjob #396).
 *
 * `/autocomplete/<type>` 404s for every non-native registry vocab ("OpenAlex
 * ID format not recognized"), and the list endpoints' `?search=` is stemmed
 * full-word search, not prefix matching ("art" doesn't match "article") — so
 * neither works for type-ahead. These vocabs are tiny (4–252 members), so we
 * generalize the SERP's static-countries fallback (zd#7567): fetch the full
 * vocab once per session from the live registry endpoint (can't drift, and
 * returns canonical ids/casing), then substring-filter locally.
 */

// Keyed by users-api collection entity_type names; callers may pass the GUI
// name (`types`) — isSmallVocabType/searchVocab normalize first. keywords is
// external but NOT here: it's large and has a real /autocomplete/keywords.
const SMALL_VOCAB_TYPES = new Set([
    "countries", "continents", "languages", "licenses", "oa-statuses",
    "source-types", "institution-types", "work-types", "sdgs",
    "domains", "fields", "subfields", "indexes", "source-lists",
    "study-designs", "relationships",
]);

const MAX_PAGES = 5; // 1,000 rows — far above the largest vocab (subfields, 252)

const cache = new Map(); // entity_type -> Promise<rows>

function isSmallVocabType(entityType) {
    return SMALL_VOCAB_TYPES.has(openalexId.toCollectionEntityType(entityType));
}

/**
 * Pure substring filter over vocab rows, matching display_name or the bare
 * code (`US`, `article`). Empty query returns the top rows — the endpoints
 * are fetched sorted by works_count, so this is a sensible browse order.
 * Type-ahead order (oxjob #1597): names that start with the text (or the code
 * itself), then names with a word that starts with it, then the rest, each in
 * that works_count order — `in` finds India before China.
 */
function filterVocabRows(rows, query, limit = 25) {
    const term = (query || "").trim().toLowerCase();
    const valid = (rows || []).filter(r => r.id && r.display_name);
    if (!term) return valid.slice(0, limit);
    const tiers = [[], [], []];
    for (const r of valid) {
        const name = r.display_name.toLowerCase();
        const code = (openalexId.getShortId(r.id) || "").toLowerCase();
        if (name.startsWith(term) || code === term) tiers[0].push(r);
        else if (name.split(/[\s-]+/).some(w => w.startsWith(term))) tiers[1].push(r);
        else if (name.includes(term) || code.includes(term)) tiers[2].push(r);
    }
    return tiers.flat().slice(0, limit);
}

async function fetchAllRows(entityType) {
    // Lazy import: apiConfig touches `window` at module scope, which would
    // make this module (and its pure filter helpers) untestable under node.
    const { urlBase } = await import("@/apiConfig.js");
    const rows = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `${urlBase.api}/${entityType}?per-page=200&page=${page}`
            + `&select=id,display_name,works_count&sort=works_count:desc&mailto=ui@openalex.org`;
        const resp = await axios.get(url);
        const results = resp.data?.results || [];
        rows.push(...results);
        const total = resp.data?.meta?.count ?? rows.length;
        if (!results.length || rows.length >= total) break;
    }
    return rows;
}

/**
 * Search a small vocab. Fetches + caches the full list on first call
 * (per session), then filters locally. Rows are raw API entities
 * ({id, display_name, works_count}) — the same shape /autocomplete returns.
 */
async function searchVocab(entityType, query) {
    const key = openalexId.toCollectionEntityType(entityType);
    if (!cache.has(key)) {
        const p = fetchAllRows(key).catch(e => {
            cache.delete(key); // don't cache failures — retry on next call
            throw e;
        });
        cache.set(key, p);
    }
    return filterVocabRows(await cache.get(key), query);
}

export {
    isSmallVocabType,
    searchVocab,
    filterVocabRows,
    SMALL_VOCAB_TYPES,
};
