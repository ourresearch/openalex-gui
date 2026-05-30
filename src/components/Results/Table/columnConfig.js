/**
 * Resolve table-view column keys into renderable column descriptors.
 *
 * Framework-free + pure (no Vue) so it's unit-testable and reusable by the
 * renderer (ResultsTable.vue), the future column picker (Phase 4), and the CSV
 * exporter (Phase 7).
 *
 * A column key may carry a ":ids" suffix requesting the *bare-ID variant* of an
 * entity-typed property — e.g. "authorships.author.id:ids" renders the authors'
 * bare OpenAlex IDs (A5023…) instead of their linked names. We split that suffix
 * off, resolve the base property's facet config, and (for ":ids") derive a
 * stringList/bareId render from the entity column. The base property's extractFn
 * is shared by both variants — the IDs variant just reads the `id` field off
 * each extracted item and bare-formats it.
 *
 * QA-051 discipline: an unknown, ineligible, or malformed key is dropped with a
 * console.warn — NEVER thrown — so a bad URL `column=` value can't blank the
 * whole table.
 */

import { getFacetConfig } from "@/facetConfigUtils";

// Render kinds whose values are entity objects ({ id, display_name }). Only
// these support an auto-derived ":ids" sibling column.
const ENTITY_KINDS = new Set(["entityLink", "entityList"]);

// Scalar render kinds — a single value per cell. For these we can synthesize a
// fallback extractFn from the property's dotted key path when the config lacks
// its own (Phase 6). Entity kinds (entityList/entityLink) can't be derived this
// way — their values are objects assembled by a real extractFn.
const SCALAR_KINDS = new Set(["number", "currency", "boolean", "date", "year", "text"]);

// Heuristics for deriving a numeric range's render kind from its key.
const CURRENCY_RE = /usd|amount|apc|price|cost/i;
const DATE_RE = /(^|[._])date($|[._])/i;

/**
 * Derive a column's render kind from its facet config — the heart of the Phase 6
 * catalog sweep. An explicit `column.render` block always wins (per-property
 * override / fine-tuning); otherwise we map the property's `type` to a render
 * kind so that *every* non-search property becomes a column with no per-entry
 * editing. Returns null for types that aren't displayable as a column (pure
 * `search` inputs, etc.) unless they carry an explicit block (e.g. `abstract`).
 */
export function deriveColumnRender(config) {
    if (!config) return null;
    if (config.column?.render) return config.column.render;
    if (config.isIdentityColumn) return { kind: "entityLink" };
    switch (config.type) {
        case "boolean":
            return { kind: "boolean" };
        case "selectEntity":
            // Entity-typed: linked names by default; the bare-ID variant is the
            // ":ids" sibling. `isId` configs (ROR, ORCID, …) already extract to
            // ID strings/URLs → stringList (auto-linkified).
            if (config.isId) return { kind: "stringList" };
            return { kind: "entityList", itemLabelField: "display_name", itemLinkField: "id" };
        case "range":
        case "sum": {
            const k = config.key || "";
            if (k === "publication_year") return { kind: "year" };
            if (CURRENCY_RE.test(k)) return { kind: "currency" };
            if (config.isDate || DATE_RE.test(k)) return { kind: "date" };
            return { kind: "number" };
        }
        case "url":
        case "text":
            return { kind: "text" };
        default:
            return null;
    }
}

/**
 * The extractFn a column should use: the config's own when present, else a
 * synthesized dotted-key-path reader for scalar columns (safe — returns
 * undefined → a blank "—" cell when the key isn't a real response path, e.g.
 * derived booleans like `has_abstract`). Entity columns with no extractFn return
 * null (not column-eligible — can't assemble objects from a filter key).
 */
export function getColumnExtractFn(config) {
    if (typeof config?.extractFn === "function") return config.extractFn;
    const kind = deriveColumnRender(config)?.kind;
    if (kind && SCALAR_KINDS.has(kind) && config?.key) {
        const path = config.key.split(".");
        return (entity) => path.reduce((o, p) => (o == null ? undefined : o[p]), entity);
    }
    return null;
}

/**
 * Is this facet config usable as a table column? It must (a) map to a render
 * kind and (b) have a usable extractFn. `is_xpac` is excluded (an internal
 * flag, not a user-facing column). The identity column is always eligible.
 */
export function isColumnEligible(config) {
    if (!config) return false;
    if (config.key === "is_xpac") return false;
    if (config.isIdentityColumn) return true;
    if (!deriveColumnRender(config)) return false;
    return !!getColumnExtractFn(config);
}

/** Split a raw column key into its base property key and optional variant. */
export function parseColumnKey(rawKey) {
    const idx = rawKey.indexOf(":");
    if (idx === -1) return { baseKey: rawKey, variant: null };
    return { baseKey: rawKey.slice(0, idx), variant: rawKey.slice(idx + 1) };
}

/**
 * Resolve one raw column key to a descriptor, or null (with a warn) if the key
 * is unknown / not column-eligible / an invalid variant.
 *
 * Descriptor shape:
 *   { key, baseKey, variant, label, render, booleanValues, extractFn,
 *     isIdentityColumn }
 * `label` is the raw human label (the caller capitalizes for display).
 */
export function resolveColumn(entityType, rawKey) {
    const { baseKey, variant } = parseColumnKey(rawKey);
    const config = getFacetConfig(entityType, baseKey);
    // Render kind is derived from the property's `type` (Phase 6) — an explicit
    // `column.render` block overrides. `isIdentityColumn` (display_name) is a
    // RENDER marker only (value = the row entity → self-link); it carries NO
    // "can't remove / always first" semantics — Title is an ordinary, removable,
    // reorderable column (Phase 5.5). The ≥1-column floor lives in useColumnsState.
    const baseRender = deriveColumnRender(config);
    const baseExtractFn = getColumnExtractFn(config);
    if (!config || !baseRender || !baseExtractFn) {
        console.warn(
            `columnConfig: dropping unknown/ineligible column key "${rawKey}" for "${entityType}"`,
        );
        return null;
    }
    const baseLabel = config.column?.label ?? config.displayName ?? baseKey;

    if (variant === "ids") {
        // Auto-derived bare-ID sibling of an entity-typed column. Only valid for
        // entity kinds (those whose items carry an `id` to strip to bare form).
        if (!ENTITY_KINDS.has(baseRender.kind)) {
            console.warn(
                `columnConfig: ":ids" variant requested for non-entity column "${baseKey}"; dropping`,
            );
            return null;
        }
        const linkField = baseRender.itemLinkField || "id";
        return {
            key: rawKey,
            baseKey,
            variant: "ids",
            label: `${baseLabel} IDs`,
            render: { kind: "stringList", bareId: true, itemLinkField: linkField },
            booleanValues: null,
            extractFn: baseExtractFn,
            // An :ids sibling is never the identity column (that's the
            // linked-name display_name column it derives from).
            isIdentityColumn: false,
            // Sort/filter from the header menu operate on the BASE property, so
            // both variants carry the base config's capabilities + type.
            actions: config.actions ?? [],
            facetType: config.type ?? null,
        };
    }

    if (variant !== null) {
        console.warn(`columnConfig: unknown column variant "${variant}" on "${rawKey}"; dropping`);
        return null;
    }

    return {
        key: rawKey,
        baseKey,
        variant: null,
        label: baseLabel,
        render: baseRender,
        booleanValues: config.booleanValues ?? null,
        extractFn: baseExtractFn,
        isIdentityColumn: !!config.isIdentityColumn,
        // Capabilities surfaced by the column header menu (Sort / Filter by this).
        actions: config.actions ?? [],
        facetType: config.type ?? null,
    };
}

/** Resolve an ordered list of raw keys, dropping any that don't resolve. */
export function resolveColumns(entityType, keys) {
    if (!Array.isArray(keys)) return [];
    return keys.map((k) => resolveColumn(entityType, k)).filter(Boolean);
}
