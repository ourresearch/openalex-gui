import { api } from "@/api";
import { urlBase } from "@/apiConfig.js";
import { classifyRequestError, refusalReason } from "@/requestRefusal";
import * as openalexId from "@/openalexId";

const DOI_RE = /\b10\.\d{2,}\/\S+/i;
const ORCID_RE = /\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/i;
const ROR_RE = /\b0\w{8}\b/i;
const ISSN_RE = /\b\d{4}-\d{3}[\dXx]\b/;
const FULL_OX_URL_RE = /openalex\.org\/([WAISPFCTGK])(\d+)/i;

const externalNamespaceByEntityType = {
    works: "doi",
    authors: "orcid",
    institutions: "ror",
    sources: "issn",
    funders: "doi",
};

// Lookups go out in batches through list filters (oxjob #1923, ZD 26619): one
// `/works?filter=doi:a|b|...` call per 100 lines. Looking up each line on its
// own, 8 at a time, ran past the keyless 10 requests/second limit, and every
// refused (429) line showed as unmatched although the work exists.
// 100 is the API's cap on values in one filter (101 answers 400).
const BATCH_SIZE = 100;
const BATCH_CONCURRENCY = 2;
// Lines that can't batch (vocab codes, funder DOIs) get one call each. 2 at once
// stays near the keyless 10 requests/second; the retries absorb the rest.
const SINGLE_CONCURRENCY = 2;
const RETRIES = 3;
const LOOKUP_FAILED = "lookup failed, try again";

const stripPrefix = (s, re) => String(s).trim().replace(re, "");

// How each entity type's external IDs batch: the list filter is the type's
// namespace above, `select` names the field(s) the API returns the ID in, and
// `key` is the form both sides compare by. Funders are missing on purpose:
// `funders?filter=doi:` is not a filter (400), so funder DOIs stay one call each.
const batchSpecByEntityType = {
    works: { select: "doi", key: s => stripPrefix(s, /^https?:\/\/(dx\.)?doi\.org\//i).toLowerCase() },
    authors: { select: "orcid", key: s => stripPrefix(s, /^https?:\/\/orcid\.org\//i).toUpperCase() },
    institutions: { select: "ror", key: s => stripPrefix(s, /^https?:\/\/ror\.org\//i).toLowerCase() },
    sources: { select: "issn,issn_l", key: s => String(s).trim().toUpperCase() },
};

const miss = reason => ({ resolved: null, reason });

// The signed-in user's key, the shared refusal policy (a spent budget opens the
// credit dialog for a signed-out visitor), and up to RETRIES more tries.
const apiGet = url => api.getUrl(url, undefined, { retries: RETRIES });

// What a line says when its lookup failed. Only "not found" means the ID isn't
// in OpenAlex; a refusal that may clear reads "lookup failed, try again".
function missFromError(e) {
    if (classifyRequestError(e).status === 404) return miss("not found");
    const { short } = refusalReason(e);
    return short ? miss(`lookup failed: ${short}`) : { ...miss(LOOKUP_FAILED), failed: true };
}

function stripUrl(s) {
    return s.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
}

function detectExternalKind(raw) {
    const s = raw.trim();
    if (FULL_OX_URL_RE.test(s)) return { kind: "openalex" };
    if (DOI_RE.test(s)) return { kind: "doi", value: s.match(DOI_RE)[0] };
    if (ORCID_RE.test(s)) return { kind: "orcid", value: s.match(ORCID_RE)[0] };
    if (ROR_RE.test(s) && /ror\.org|^0/.test(stripUrl(s))) return { kind: "ror", value: s.match(ROR_RE)[0] };
    if (ISSN_RE.test(s)) return { kind: "issn", value: s.match(ISSN_RE)[0] };
    return { kind: null };
}

// Bare-digit (no prefix letter) sniff. QA-049c: users paste `2755968057`
// expecting it to resolve to `W2755968057` on /works. Only meaningful for
// native entity types that have a single-letter ID prefix (W/A/I/S/P/F/C/T/G);
// no-op for external types like sdgs/keywords/etc.
const BARE_DIGITS_RE = /^\d+$/;

/**
 * External (non-native) vocab types: sdgs, keywords, countries, work-types,
 * etc. Input may be a bare code (`US`, `3`, `article`), a namespaced id
 * (`countries/US`, `types/article`), or a full OpenAlex URL. Resolution is a
 * singleton `GET /{entity_type}/{code}`: it validates existence, returns the
 * canonical-case id (users-api stores codes verbatim and the `collection:`
 * filter matches them case-sensitively), and fetches display_name (oxjob #396).
 * shortcut: one call per distinct code; these vocabularies are small (17 SDGs,
 * ~250 countries). Batch them through `filter=id:` if people paste thousands.
 */
function planVocab(raw, entity_type, guiType) {
    const normalized = openalexId.normalizeId(raw);
    if (normalized) {
        const ty = openalexId.getEntityType(normalized);
        if (ty !== guiType) return { row: miss(`wrong entity type (got ${ty}, expected ${entity_type})`) };
        return { single: openalexId.getShortId(normalized) };
    }
    if (/[\s/]/.test(raw)) return { row: miss("unrecognized format") };
    return { single: raw };
}

/**
 * Decide what one (trimmed, non-empty) line needs, without a network call:
 * - `{ row }`: settled already (an OpenAlex ID, wrong type, bad format);
 * - `{ batch: { value, key } }`: an external ID that can go in a batched list filter;
 * - `{ single: path }`: needs its own `GET /{entity_type}/{path}` (vocab codes,
 *   funder DOIs, and DOIs containing `,` or `|`, which a filter would split).
 */
function planOne(raw, entity_type) {
    const guiType = openalexId.fromCollectionEntityType(entity_type);
    if (!openalexId.isNativeEntityType(guiType)) return planVocab(raw, entity_type, guiType);

    // QA-049c: bare digits (e.g. "2755968057") get prefixed with the entity's
    // native letter so they resolve. Pure-digit IDs are how the OpenAlex API
    // also accepts them (`/works/2755968057` 302s to `/works/W2755968057`)
    // and people copy them from URLs that strip the prefix.
    let normalized = raw;
    if (BARE_DIGITS_RE.test(raw)) {
        const prefix = openalexId.ENTITY_TO_NATIVE_PREFIX?.[entity_type];
        if (prefix) {
            normalized = prefix.toUpperCase() + raw;
        }
    }

    // 1. An OpenAlex ID, bare or as a URL ("https://openalex.org/W123")?
    const oxId = openalexId.isValidId(normalized) ? normalized
        : FULL_OX_URL_RE.test(raw) ? raw : null;
    if (oxId) {
        const ty = openalexId.getEntityType(oxId);
        if (ty !== entity_type) return { row: miss(`wrong entity type (got ${ty}, expected ${entity_type})`) };
        // display_name comes via enrichDisplayNames() in a batched second pass.
        return { row: { resolved: openalexId.toCollectionEntityId(oxId) } };
    }

    // 2. An external ID. Only certain entity types support external IDs.
    const detected = detectExternalKind(raw);
    const expectedNs = externalNamespaceByEntityType[entity_type];
    if (!expectedNs || detected.kind !== expectedNs) {
        return { row: miss(detected.kind ? `${detected.kind} not supported for ${entity_type}` : "unrecognized format") };
    }
    const spec = batchSpecByEntityType[entity_type];
    if (!spec || /[,|]/.test(detected.value)) return { single: `${detected.kind}:${detected.value}` };
    return { batch: { value: detected.value, key: spec.key(detected.value) } };
}

async function lookupSingle(path, entity_type) {
    const url = `${urlBase.api}/${entity_type}/${encodeURIComponent(path)}?select=id,display_name&mailto=ui@openalex.org`;
    try {
        const data = await apiGet(url);
        const short = data?.id && openalexId.toCollectionEntityId(data.id);
        if (!short) return miss("not found");
        return { resolved: short, display_name: data.display_name || undefined };
    } catch (e) {
        return missFromError(e);
    }
}

/**
 * Look up one batch of external IDs with a single list call. Returns
 * `{ found: Map(key -> {resolved, display_name}), recheckMisses }`; with
 * recheckMisses the caller looks up this batch's misses one by one. Throws
 * when the call was refused for good.
 */
async function lookupBatch(keys, values, entity_type) {
    const spec = batchSpecByEntityType[entity_type];
    const filter = `${externalNamespaceByEntityType[entity_type]}:${values.join("|")}`;
    // per_page 200: two works can share one DOI, so 100 values can return more than 100 rows.
    const url = `${urlBase.api}/${entity_type}?filter=${encodeURIComponent(filter)}&select=id,display_name,${spec.select}&per_page=200&mailto=ui@openalex.org`;
    let data;
    try {
        data = await apiGet(url);
    } catch (e) {
        // One odd value can make the API refuse the whole filter (400).
        if (classifyRequestError(e).kind === "invalid") return { found: new Map(), recheckMisses: true };
        throw e;
    }
    const wanted = new Set(keys);
    const found = new Map();
    let unmapped = 0;
    const results = data?.results || [];
    for (const r of results) {
        const short = r.id && openalexId.toCollectionEntityId(r.id);
        const hits = spec.select.split(",").flatMap(f => r[f] ?? []).map(spec.key).filter(k => wanted.has(k));
        if (!short || hits.length === 0) {
            unmapped++;
            continue;
        }
        for (const k of hits) {
            // First result wins when two share an ID.
            if (!found.has(k)) found.set(k, { resolved: short, display_name: r.display_name || undefined });
        }
    }
    // The API matched something we couldn't map back (it normalizes an ID
    // differently than spec.key), or the page was cut off: re-check the misses
    // one by one rather than call them not found.
    const truncated = (data?.meta?.count ?? 0) > results.length;
    return { found, recheckMisses: unmapped > 0 || truncated };
}

async function runPool(items, concurrency, fn) {
    let cursor = 0;
    async function worker() {
        while (cursor < items.length) {
            await fn(items[cursor++]);
        }
    }
    const workers = [];
    for (let i = 0; i < Math.min(concurrency, items.length); i++) workers.push(worker());
    await Promise.all(workers);
}

function chunk(items, size) {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

/**
 * Resolve a list of raw input strings into short-form OpenAlex IDs.
 * External IDs (DOIs, ORCIDs, RORs, ISSNs) go out 100 per list call; lines
 * that can't batch get one call per distinct value. Every call carries the
 * signed-in user's key and retries transient refusals. A line whose lookup
 * still fails reads "lookup failed, try again" (`failed: true`), never
 * "not found".
 *
 * @param {string[]} rawInputs - lines pasted/uploaded by the user
 * @param {string} entity_type - target entity type (works | authors | ...)
 * @param {{onProgress?: (done, total) => void}} opts
 * @returns {Promise<Array<{input, resolved, display_name?, reason?, failed?}>>}
 */
async function resolveIds(rawInputs, entity_type, opts = {}) {
    const onProgress = opts.onProgress || (() => {});

    const cleaned = (rawInputs || [])
        .map(s => (s == null ? "" : String(s).trim()))
        .filter(s => s.length > 0);

    const total = cleaned.length;
    const results = new Array(total);
    let done = 0;
    const settle = (idxs, row) => {
        for (const idx of idxs) results[idx] = { input: cleaned[idx], ...row };
        done += idxs.length;
        onProgress(done, total);
    };

    // Plan every line; a pasted list often repeats an ID, so each distinct one is looked up once.
    const batchGroups = new Map(); // key -> { value, idxs }
    const singleGroups = new Map(); // path -> idxs
    cleaned.forEach((raw, idx) => {
        const plan = planOne(raw, entity_type);
        if (plan.row) {
            settle([idx], plan.row);
        } else if (plan.batch) {
            const { key, value } = plan.batch;
            if (!batchGroups.has(key)) batchGroups.set(key, { value, idxs: [] });
            batchGroups.get(key).idxs.push(idx);
        } else {
            if (!singleGroups.has(plan.single)) singleGroups.set(plan.single, []);
            singleGroups.get(plan.single).push(idx);
        }
    });

    const singles = [...singleGroups]; // [path, idxs]
    const ns = externalNamespaceByEntityType[entity_type];
    await runPool(chunk([...batchGroups.keys()], BATCH_SIZE), BATCH_CONCURRENCY, async keys => {
        const groups = keys.map(k => batchGroups.get(k));
        let outcome;
        try {
            outcome = await lookupBatch(keys, groups.map(g => g.value), entity_type);
        } catch (e) {
            const row = missFromError(e);
            for (const g of groups) settle(g.idxs, row);
            return;
        }
        keys.forEach((k, i) => {
            const hit = outcome.found.get(k);
            if (hit) settle(groups[i].idxs, hit);
            else if (outcome.recheckMisses) singles.push([`${ns}:${groups[i].value}`, groups[i].idxs]);
            else settle(groups[i].idxs, miss("not found"));
        });
    });

    await runPool(singles, SINGLE_CONCURRENCY, async ([path, idxs]) => {
        settle(idxs, await lookupSingle(path, entity_type));
    });

    return results;
}

/**
 * Batched display_name lookup. Mutates rows in-place — sets `display_name`
 * on any successfully-resolved row that doesn't already have one.
 *
 * Uses the OpenAlex `?filter=openalex:W1|W2|...&select=id,display_name`
 * shape so 10K bare-OpenAlex-ID pastes cost 100 calls instead of 10K
 * individual /works/{id} fetches.
 *
 * Silent on per-batch failures (the wizard already works without
 * display_names; this is enrichment, not validation).
 */
async function enrichDisplayNames(rows, entity_type) {
    const unique = [...new Set(rows.filter(r => r.resolved && !r.display_name).map(r => r.resolved))];
    if (unique.length === 0) return;

    // External vocab endpoints have no `openalex:` filter; batch by `id:`
    // instead (accepts bare codes, case-insensitively). Their rows normally
    // arrive pre-named from their singleton lookup, so this is a fallback path.
    const isExternal = !openalexId.isNativeEntityType(
        openalexId.fromCollectionEntityType(entity_type)
    );
    const filterParam = isExternal ? "id" : "openalex";

    const byId = new Map();
    // BATCH_SIZE, not 200: an `openalex:` filter with 101 values answers 400,
    // which left every paste of more than 100 OpenAlex IDs without titles.
    await runPool(chunk(unique, BATCH_SIZE), 4, async batch => {
        const filter = `${filterParam}:${batch.join("|")}`;
        const url = `${urlBase.api}/${entity_type}?filter=${encodeURIComponent(filter)}&select=id,display_name&per_page=${BATCH_SIZE}&mailto=ui@openalex.org`;
        try {
            const data = await apiGet(url);
            for (const r of data?.results || []) {
                // Key by the stored collection id form so the row.resolved
                // lookup below matches (bare code for externals, W123 for natives).
                const short = openalexId.toCollectionEntityId(r.id);
                if (short && r.display_name) byId.set(short, r.display_name);
            }
        } catch {
            // Enrichment is best-effort — a failed batch just means
            // those rows show ID without title. Don't surface an error.
        }
    });

    for (const row of rows) {
        if (row.resolved && !row.display_name) {
            const name = byId.get(row.resolved);
            if (name) row.display_name = name;
        }
    }
}

export {
    resolveIds,
    enrichDisplayNames,
    LOOKUP_FAILED,
};
