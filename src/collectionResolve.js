import axios from "axios";
import { urlBase } from "@/apiConfig.js";
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
 * Resolve one raw string for an external (non-native) vocab type: sdgs,
 * keywords, countries, work-types, etc. Input may be a bare code (`US`, `3`,
 * `article`), a namespaced id (`countries/US`, `types/article`), or a full
 * OpenAlex URL. Resolution is a singleton `GET /{entity_type}/{code}` — one
 * call that validates existence, returns the canonical-case id (users-api
 * stores codes verbatim and the `collection:` filter matches them
 * case-sensitively), and fetches display_name (oxjob #396).
 */
async function resolveExternalVocab(raw, trimmed, entity_type, guiType) {
    let code = trimmed;
    const normalized = openalexId.normalizeId(trimmed);
    if (normalized) {
        const ty = openalexId.getEntityType(normalized);
        if (ty !== guiType) {
            return { input: raw, resolved: null, reason: `wrong entity type (got ${ty}, expected ${entity_type})` };
        }
        code = openalexId.getShortId(normalized);
    } else if (/[\s/]/.test(trimmed)) {
        return { input: raw, resolved: null, reason: "unrecognized format" };
    }

    const url = `${urlBase.api}/${entity_type}/${encodeURIComponent(code)}?select=id,display_name&mailto=ui@openalex.org`;
    try {
        const resp = await axios.get(url);
        const id = resp.data?.id;
        const short = id && openalexId.toCollectionEntityId(id);
        if (!short) return { input: raw, resolved: null, reason: "not found" };
        return { input: raw, resolved: short, display_name: resp.data?.display_name || undefined };
    } catch (e) {
        if (e.response?.status === 404) {
            return { input: raw, resolved: null, reason: "not found" };
        }
        return { input: raw, resolved: null, reason: `lookup failed: ${e.response?.status || e.message}` };
    }
}

/**
 * Resolve a single raw string into a short-form OpenAlex ID, given the target entity type.
 * `entity_type` is the users-api collection entity_type (`work-types`, not `types`).
 * @returns {Promise<{input: string, resolved: string|null, display_name?: string, reason?: string}>}
 */
async function resolveOne(raw, entity_type) {
    const trimmed = (raw || "").trim();
    if (!trimmed) return { input: raw, resolved: null, reason: "empty" };

    // External vocab types (no single-letter ID prefix) resolve via singleton
    // lookup — bare codes like `US` / `3` / `article` aren't parseable as
    // OpenAlex ids locally, and the response supplies the canonical case.
    const guiType = openalexId.fromCollectionEntityType(entity_type);
    if (!openalexId.isNativeEntityType(guiType)) {
        return resolveExternalVocab(raw, trimmed, entity_type, guiType);
    }

    // QA-049c: bare digits (e.g. "2755968057") get prefixed with the entity's
    // native letter so they resolve. Pure-digit IDs are how the OpenAlex API
    // also accepts them (`/works/2755968057` 302s to `/works/W2755968057`)
    // and people copy them from URLs that strip the prefix.
    let normalized = trimmed;
    if (BARE_DIGITS_RE.test(trimmed)) {
        const prefix = openalexId.ENTITY_TO_NATIVE_PREFIX?.[entity_type];
        if (prefix) {
            normalized = prefix.toUpperCase() + trimmed;
        }
    }

    // 1. Is it already a bare OpenAlex ID (short or URL)?
    if (openalexId.isValidId(normalized)) {
        const ty = openalexId.getEntityType(normalized);
        if (ty !== entity_type) {
            return { input: raw, resolved: null, reason: `wrong entity type (got ${ty}, expected ${entity_type})` };
        }
        const short = openalexId.toDisplayFormat(normalized, "short");
        // display_name comes via enrichDisplayNames() in a batched second pass
        // so we don't add 10K individual /works/{id} calls to a paste of 10K
        // bare OpenAlex IDs.
        return { input: raw, resolved: short };
    }

    // 2. Try as an external ID. Only certain entity types support external IDs.
    const detected = detectExternalKind(trimmed);
    if (detected.kind === "openalex") {
        // Some users paste "https://openalex.org/W123" — parse and validate.
        const ty = openalexId.getEntityType(trimmed);
        if (ty !== entity_type) {
            return { input: raw, resolved: null, reason: `wrong entity type (got ${ty}, expected ${entity_type})` };
        }
        return { input: raw, resolved: openalexId.toDisplayFormat(trimmed, "short") };
    }

    const expectedNs = externalNamespaceByEntityType[entity_type];
    if (!expectedNs || detected.kind !== expectedNs) {
        return { input: raw, resolved: null, reason: detected.kind ? `${detected.kind} not supported for ${entity_type}` : "unrecognized format" };
    }

    // QA-049b: select=id,display_name so external-ID lookups (which already
    // cost one network call per row) return the human-readable title /
    // author name for free. Bare OpenAlex IDs get their display_name via the
    // batched enrichDisplayNames() pass below.
    const namespacedFilter = `${detected.kind}:${detected.value}`;
    const url = `${urlBase.api}/${entity_type}/${encodeURIComponent(namespacedFilter)}?select=id,display_name&mailto=ui@openalex.org`;
    try {
        const resp = await axios.get(url);
        const data = resp.data;
        // /works/doi:... returns the single matching entity (not a results list).
        const id = data?.id;
        if (!id) return { input: raw, resolved: null, reason: "not found" };
        const short = openalexId.toDisplayFormat(id, "short");
        if (!short) return { input: raw, resolved: null, reason: "could not normalize OpenAlex response id" };
        return { input: raw, resolved: short, display_name: data?.display_name || undefined };
    } catch (e) {
        if (e.response?.status === 404) {
            return { input: raw, resolved: null, reason: "not found" };
        }
        return { input: raw, resolved: null, reason: `lookup failed: ${e.response?.status || e.message}` };
    }
}

/**
 * Resolve a list of raw input strings into short-form OpenAlex IDs.
 * Uses concurrency-limited parallel lookups (default 8) and dedupes inputs.
 *
 * @param {string[]} rawInputs - lines pasted/uploaded by the user
 * @param {string} entity_type - target entity type (works | authors | ...)
 * @param {{concurrency?: number, onProgress?: (done, total) => void}} opts
 * @returns {Promise<Array<{input, resolved, reason?}>>}
 */
async function resolveIds(rawInputs, entity_type, opts = {}) {
    const concurrency = opts.concurrency ?? 8;
    const onProgress = opts.onProgress || (() => {});

    const cleaned = (rawInputs || [])
        .map(s => (s == null ? "" : String(s).trim()))
        .filter(s => s.length > 0);

    const results = new Array(cleaned.length);
    let cursor = 0;
    let done = 0;
    const total = cleaned.length;

    async function worker() {
        while (true) {
            const idx = cursor++;
            if (idx >= total) return;
            results[idx] = await resolveOne(cleaned[idx], entity_type);
            done++;
            onProgress(done, total);
        }
    }

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, Math.max(1, total)); i++) {
        workers.push(worker());
    }
    await Promise.all(workers);
    return results;
}

/**
 * Batched display_name lookup. Mutates rows in-place — sets `display_name`
 * on any successfully-resolved row that doesn't already have one.
 *
 * Uses the OpenAlex `?filter=openalex:W1|W2|...&select=id,display_name`
 * shape so 10K bare-OpenAlex-ID pastes cost ~50 calls (per-page max 200)
 * instead of 10K individual /works/{id} fetches. Concurrency-limited to
 * keep the wizard responsive.
 *
 * Silent on per-batch failures (the wizard already works without
 * display_names; this is enrichment, not validation).
 */
async function enrichDisplayNames(rows, entity_type, opts = {}) {
    const concurrency = opts.concurrency ?? 4;
    const onProgress = opts.onProgress || (() => {});

    const needIds = rows.filter(r => r.resolved && !r.display_name).map(r => r.resolved);
    const unique = [...new Set(needIds)];
    if (unique.length === 0) return;

    // External vocab endpoints have no `openalex:` filter; batch by `id:`
    // instead (accepts bare codes, case-insensitively). Their rows normally
    // arrive pre-named from resolveExternalVocab, so this is a fallback path.
    const isExternal = !openalexId.isNativeEntityType(
        openalexId.fromCollectionEntityType(entity_type)
    );
    const filterParam = isExternal ? "id" : "openalex";

    const PER_PAGE = 200;
    const batches = [];
    for (let i = 0; i < unique.length; i += PER_PAGE) {
        batches.push(unique.slice(i, i + PER_PAGE));
    }

    let done = 0;
    const total = batches.length;
    const byId = new Map();

    let cursor = 0;
    async function worker() {
        while (true) {
            const idx = cursor++;
            if (idx >= total) return;
            const batch = batches[idx];
            const filter = `${filterParam}:${batch.join("|")}`;
            const url = `${urlBase.api}/${entity_type}?filter=${encodeURIComponent(filter)}&select=id,display_name&per-page=${PER_PAGE}&mailto=ui@openalex.org`;
            try {
                const resp = await axios.get(url);
                const results = resp.data?.results || [];
                for (const r of results) {
                    // Key by the stored collection id form so the row.resolved
                    // lookup below matches (bare code for externals, W123 for natives).
                    const short = openalexId.toCollectionEntityId(r.id);
                    if (short && r.display_name) byId.set(short, r.display_name);
                }
            } catch {
                // Enrichment is best-effort — a failed batch just means
                // those rows show ID without title. Don't surface an error.
            }
            done++;
            onProgress(done, total);
        }
    }
    const workers = [];
    for (let i = 0; i < Math.min(concurrency, batches.length); i++) {
        workers.push(worker());
    }
    await Promise.all(workers);

    for (const row of rows) {
        if (row.resolved && !row.display_name) {
            const name = byId.get(row.resolved);
            if (name) row.display_name = name;
        }
    }
}

export {
    resolveIds,
    resolveOne,
    enrichDisplayNames,
    detectExternalKind,
};
