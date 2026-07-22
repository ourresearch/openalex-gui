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
 * console.warn — NEVER thrown — so a bad stored column key can't blank the
 * whole table.
 */

import { getFacetConfig } from "@/facetConfigUtils";

// Render kinds whose values are entity objects ({ id, display_name }). Only
// these support an auto-derived ":ids" sibling column.
const ENTITY_KINDS = new Set(["entityLink", "entityList"]);

// `selectEntity` properties whose `entityToSelect` is a real OpenAlex entity
// index — items carry a parseable OpenAlex id (`A5023…`, `C108…`, etc.). A
// ":ids" bare-ID sibling is meaningful for these. Everything else
// (`type`/`language`/`country_codes` …) maps to a controlled vocabulary — the
// "id" is a code, not an OpenAlex id, and a ":ids" sibling renders empty.
const ID_BEARING_SELECT_ENTITIES = new Set([
    "works", "authors", "concepts", "topics",
    "institutions", "sources", "publishers", "funders",
    "keywords", "domains", "fields", "subfields", "sdgs",
]);

/**
 * Should this property advertise a ":ids" sibling column? True when the column
 * is entity-rendered AND items carry parseable OpenAlex ids. The picker uses
 * this to decide whether the bare-ID alternate shows up as a sibling row.
 *
 * Requires an explicit `extractFn` — the synthesized dotted-path fallback
 * returns raw strings (`display_name_alternatives`, …), which look like an
 * entityList at config-time but produce no ids at runtime. A real `:ids`
 * sibling always pairs with a real extractFn that yields `{id, display_name}`.
 */
export function hasIdsSibling(config) {
    if (!config || config.isIdentityColumn) return false;
    if (config.noIdsSibling) return false;
    if (typeof config.extractFn !== "function") return false;
    // Count-style cells (`cited_by` -> `cited_by_count`, `cites` -> 26) render
    // a single scalar count, not real entity objects. A ":ids" sibling has no
    // meaningful content — gate it out.
    if (config.isDisplayedAsCount) return false;
    const render = deriveColumnRender(config);
    if (!render || !ENTITY_KINDS.has(render.kind)) return false;
    if (!config.entityToSelect) return false;
    return ID_BEARING_SELECT_ENTITIES.has(config.entityToSelect);
}

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

// ---------------------------------------------------------------------------
// Export spec (job #304): map a resolved column → server flat-path + header.
// ---------------------------------------------------------------------------

// Default derivation rules:
//   - identity column (display_name): path = "display_name"
//   - ":ids" variant of an entity column: path = baseKey (bare-ID flat-path)
//   - entityLink / entityList: path = baseKey with trailing ".id" replaced by
//     ".{itemLabelField}" (typically "display_name")
//   - scalar / stringList / text: path = baseKey
//
// Per-config override via `column.export: { path?, header?, recipe? }`:
//   - `path` overrides the names path; the ":ids" path is auto-derived by
//     swapping the trailing label-field segment for the link-field segment
//     (override.path ".display_name" → ".id" when itemLinkField = "id").
//   - `recipe` (e.g. "unique") applies to both variants — the recipe operates
//     on the |-joined flat value the server produces.
//
// Server recipe registry (openalex-users-api/formats/csv.py):
//   - "unique"  — split the |-joined value, dedupe first-seen, rejoin.
//   - Computed columns whose values the server already pre-flattens (e.g.
//     `abstract` for works) need no recipe — the path resolves directly.

/**
 * Does this column render real entity objects (`{id, display_name}`)? If yes,
 * the server flat path for the names column is `{baseKey}.display_name`. If
 * no — selectEntity properties whose entityToSelect points to a controlled
 * vocabulary (languages, types, oa-statuses, …) or whose extractFn returns
 * plain strings (homepage_url, alternate_titles, description, …) — the flat
 * path IS the base key. Mirrors `hasIdsSibling`'s entity-vs-vocabulary call.
 */
function rendersEntityObjects(config) {
    if (!config) return false;
    if (typeof config.extractFn !== "function") return false;
    // `noIdsSibling` also means "items aren't entity objects" — they're plain
    // strings (e.g. authors/display_name_alternatives returns name strings).
    // The server flat path for these is the base key, not `{base}.display_name`.
    if (config.noIdsSibling) return false;
    if (!config.entityToSelect) return false;
    return ID_BEARING_SELECT_ENTITIES.has(config.entityToSelect);
}

function deriveExportPath(col, override, config) {
    if (col.isIdentityColumn) return override.path ?? "display_name";

    const linkField = col.render?.itemLinkField || "id";
    if (col.variant === "ids") {
        // Bare-ID path resolution, in priority order:
        //   1. explicit `column.export.idsPath` (for columns whose name + id
        //      paths don't share a dotted prefix, e.g. sources/publisher
        //      where name = "host_organization_name" but id = "host_organization")
        //   2. swap the trailing label-field segment of an overridden
        //      names-path for the link-field segment (legacy default)
        //   3. fall back to the base key (already the bare-ID flat-path for
        //      most plain entity columns, e.g. "authorships.author.id")
        if (override.idsPath) return override.idsPath;
        if (override.path) {
            const m = override.path.match(/^(.+)\.[^.]+$/);
            if (m) return `${m[1]}.${linkField}`;
            return override.path;
        }
        // Default `:ids` path: if baseKey already ends in `.id` (or whatever
        // the link-field segment is), use it directly — that IS the bare-ID
        // flat-path (e.g. `authorships.author.id`, `concepts.id`). Otherwise
        // the baseKey points to an entity *object* (`siblings`, `keywords`),
        // and the bare-ID flat-path is one level deeper.
        const idSuffix = `.${linkField}`;
        if (col.baseKey.endsWith(idSuffix) || col.baseKey === linkField) return col.baseKey;
        return `${col.baseKey}${idSuffix}`;
    }

    if (override.path) return override.path;

    const kind = col.render?.kind;
    if ((kind === "entityLink" || kind === "entityList") && rendersEntityObjects(config)) {
        const labelField = col.render.itemLabelField || "display_name";
        const base = col.baseKey;
        if (base.endsWith(".id")) return base.slice(0, -3) + "." + labelField;
        return `${base}.${labelField}`;
    }
    // Plain-string entityList / scalar / stringList / text / code / etc.: the
    // server flat path IS the base key (e.g. `homepage_url`, `language`,
    // `country_code`, `description`, `alternate_titles`).
    return col.baseKey || null;
}

/**
 * Server export spec for a column key: { path, header, recipe? } or null.
 *
 * `path` is the server's dotted flat-path (what `flatten_value()` in
 * `openalex-users-api/formats/csv.py` produces).
 * `header` is the human header label for the CSV row (client owns labels —
 * the server doesn't reverse-engineer them from paths, per #304 design).
 * `recipe` (optional) names a server-side transform from the closed registry.
 *
 * Returns null only when the column key itself doesn't resolve (unknown key,
 * bad variant). A resolvable column always produces a spec.
 */
// The table view displays headers via filters.capitalize (first-letter upper),
// so the WYSIWYG export must match — otherwise the on-screen "Title" lands in
// the CSV as "title". Inlined (not imported from filters.js) to keep this
// module Vue-free.
function capitalizeFirst(s) {
    if (typeof s !== "string" || !s.length) return s;
    return s[0].toUpperCase() + s.slice(1);
}

export function getColumnExportSpec(entityType, rawKey) {
    const col = resolveColumn(entityType, rawKey);
    if (!col) return null;
    const config = getFacetConfig(entityType, col.baseKey);
    const override = config?.column?.export ?? {};
    const path = deriveExportPath(col, override, config);
    if (!path) return null;
    const spec = { path, header: override.header ?? capitalizeFirst(col.label) };
    if (override.recipe) spec.recipe = override.recipe;
    // ":ids" columns auto-receive the bare_openalex_id recipe: the table view
    // renders bare ids ("A5023…") via toDisplayFormat, but the server-side
    // flatten emits the canonical full URL ("https://openalex.org/A5023…").
    // The recipe strips the URL prefix server-side so the CSV cell matches
    // what the user sees in the table. If the column has its own recipe
    // override (e.g. `unique` on authorships.institutions.lineage), prepend
    // `bare_openalex_id` to the chain so both run.
    if (col.variant === "ids") {
        if (!spec.recipe) spec.recipe = "bare_openalex_id";
        else if (Array.isArray(spec.recipe)) spec.recipe = ["bare_openalex_id", ...spec.recipe];
        else if (spec.recipe !== "bare_openalex_id") spec.recipe = ["bare_openalex_id", spec.recipe];
    }
    // Boolean columns ship the configured booleanValues label pair so the
    // server can substitute "Open Access" / "Not Open Access" for the raw
    // True/False the canonical entity carries. WYSIWYG promise: the CSV cell
    // matches the on-screen text.
    if (col.render?.kind === "boolean" && Array.isArray(col.booleanValues)
        && col.booleanValues.length === 2
        && col.booleanValues.every((s) => typeof s === "string")) {
        spec.boolean_labels = col.booleanValues;
    }
    return spec;
}

/**
 * Map an ordered list of column keys to export specs, dropping any that don't
 * resolve. Returns the manifest the export job posts to the server.
 */
export function getColumnExportSpecs(entityType, keys) {
    if (!Array.isArray(keys)) return [];
    return keys.map((k) => getColumnExportSpec(entityType, k)).filter(Boolean);
}
