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

/**
 * Resolve a single raw string into a short-form OpenAlex ID, given the target entity type.
 * @returns {Promise<{input: string, resolved: string|null, reason?: string}>}
 */
async function resolveOne(raw, entity_type) {
    const trimmed = (raw || "").trim();
    if (!trimmed) return { input: raw, resolved: null, reason: "empty" };

    // 1. Is it already a bare OpenAlex ID (short or URL)?
    if (openalexId.isValidId(trimmed)) {
        const ty = openalexId.getEntityType(trimmed);
        if (ty !== entity_type) {
            return { input: raw, resolved: null, reason: `wrong entity type (got ${ty}, expected ${entity_type})` };
        }
        const short = openalexId.toDisplayFormat(trimmed, "short");
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

    const namespacedFilter = `${detected.kind}:${detected.value}`;
    const url = `${urlBase.api}/${entity_type}/${encodeURIComponent(namespacedFilter)}?select=id&mailto=ui@openalex.org`;
    try {
        const resp = await axios.get(url);
        const data = resp.data;
        // /works/doi:... returns the single matching entity (not a results list).
        const id = data?.id;
        if (!id) return { input: raw, resolved: null, reason: "not found" };
        const short = openalexId.toDisplayFormat(id, "short");
        if (!short) return { input: raw, resolved: null, reason: "could not normalize OpenAlex response id" };
        return { input: raw, resolved: short };
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

export {
    resolveIds,
    resolveOne,
    detectExternalKind,
};
