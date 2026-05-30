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
 *     isColumnMandatory }
 * `label` is the raw human label (the caller capitalizes for display).
 */
export function resolveColumn(entityType, rawKey) {
    const { baseKey, variant } = parseColumnKey(rawKey);
    const config = getFacetConfig(entityType, baseKey);
    // The mandatory identity column (every entity's display_name) is always a
    // link to the row's own entity, even where no explicit `column` block has
    // been added yet (the per-property catalog sweep is Phase 6). So a mandatory
    // config with no column block still resolves, as an entityLink.
    const baseRender =
        config?.column?.render ?? (config?.isColumnMandatory ? { kind: "entityLink" } : null);
    if (!config || !baseRender) {
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
            extractFn: config.extractFn,
            // An :ids sibling is never the mandatory identity column (that's the
            // linked-name display_name column).
            isColumnMandatory: false,
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
        extractFn: config.extractFn,
        isColumnMandatory: !!config.isColumnMandatory,
    };
}

/** Resolve an ordered list of raw keys, dropping any that don't resolve. */
export function resolveColumns(entityType, keys) {
    if (!Array.isArray(keys)) return [];
    return keys.map((k) => resolveColumn(entityType, k)).filter(Boolean);
}
