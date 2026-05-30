/**
 * Pure cell-formatting logic for the table view.
 *
 * This module is intentionally framework-free so it can be unit-tested without
 * a DOM and reused by both the on-screen renderer (CellValue.vue) and the CSV
 * exporter (the WYSIWYG promise: export reads the same model the cell renders).
 *
 * The render config comes from a property's `column.render` block in
 * facetConfigs.js. The closed render-kind vocabulary (10 kinds) is:
 *
 *   text | number | year | currency | boolean | date | entityLink |
 *   entityList | stringList | code
 *
 * `year` is deliberately distinct from `number`: years are identifiers, not
 * quantities — never grouped ("2024" not "2,024"), and the table renders them
 * left-aligned in the normal font, NOT right-aligned/monospaced like numbers.
 *
 * NB on field-name namespaces (a recurring confusion point):
 *   - `display_name` (snake_case) is the API field on each *item* returned by a
 *     property's extractFn — e.g. each author object has a `display_name`.
 *   - `displayName` (camelCase) is the property's human label in *our* config.
 * `itemLabelField` / `itemLinkField` below reference the snake_case API fields
 * on the extracted items, defaulting to `display_name` / `id`.
 */

import millify from "millify";
import ISO6391 from "iso-639-1";
import countryCodeLookup from "country-code-lookup";
import { parseId, toDisplayFormat } from "@/openalexId";

export const RENDER_KINDS = [
    "text",
    "number",
    "year",
    "currency",
    "boolean",
    "date",
    "entityLink",
    "entityList",
    "stringList",
    "code",
];

const EMPTY_CELL = { empty: true, multi: false, items: [] };

const isBlank = (v) =>
    v === null ||
    v === undefined ||
    v === "" ||
    (Array.isArray(v) && v.length === 0);

/**
 * A cell item is one rendered segment:
 *   { text }                         plain text
 *   { text, entityId }               internal entity link (Vue maps id -> route)
 *   { text, url }                    external link (opens in new tab)
 */
const textItem = (text) => ({ text: String(text) });

// ---- scalar kinds ---------------------------------------------------------

function formatNumber(value, render) {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    switch (render.format) {
        case "compact":
            return millify(num, { precision: 1, lowercase: false });
        default:
            return num.toLocaleString();
    }
}

// Years are identifiers, not quantities — never grouped ("2024", not "2,024").
function formatYear(value) {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    return String(Math.trunc(num));
}

function formatCurrency(value, render) {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    const currency = render.currency || "USD";
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(num);
    } catch {
        // Unknown currency code: fall back to a plain grouped number.
        return num.toLocaleString();
    }
}

function formatBoolean(value, booleanValues) {
    if (Array.isArray(booleanValues) && booleanValues.length === 2) {
        return value ? booleanValues[1] : booleanValues[0];
    }
    return value ? "true" : "false";
}

function formatDate(value) {
    const s = String(value);
    // ISO datetimes -> date portion only ("2024-03-01T00:00:00" -> "2024-03-01").
    const tIndex = s.indexOf("T");
    return tIndex > -1 ? s.slice(0, tIndex) : s;
}

function formatCode(value, render) {
    const code = String(value);
    switch (render.codebook) {
        case "languages": {
            const name = ISO6391.getName(code.toLowerCase());
            return name || code;
        }
        case "countries": {
            const result = countryCodeLookup.byIso(code.toUpperCase());
            return result?.country || code;
        }
        default:
            return code;
    }
}

// ---- entity / list kinds --------------------------------------------------

/** Build one item from an entity object ({ id, display_name, ... }). */
function entityItem(obj, render) {
    if (!obj || typeof obj !== "object") return textItem(obj ?? "");
    const labelField = render.itemLabelField || "display_name";
    const linkField = render.itemLinkField || "id";
    const label = obj[labelField];
    const rawId = obj[linkField];
    const item = textItem(label ?? "");
    // Some extracted items are id-less pseudo-objects (e.g. raw author names
    // with no resolved author). Those render as plain text, no link.
    if (rawId && parseId(rawId)) {
        item.entityId = rawId;
    }
    return item;
}

/** Build one item from an entity object, rendered as a bare ID (ID columns). */
function entityIdItem(obj, render) {
    const linkField = render.itemLinkField || "id";
    const rawId = obj && typeof obj === "object" ? obj[linkField] : obj;
    const bare = rawId ? toDisplayFormat(rawId, "bare") : null;
    return bare ? textItem(bare) : null;
}

/** Build one item from a plain string (stringList). */
function stringItem(value, render) {
    const raw = String(value);
    const text = render.bareId ? toDisplayFormat(raw, "bare") || raw : raw;
    const item = textItem(text);
    if (render.linkPattern) {
        item.url = render.linkPattern.replace("{value}", raw);
    } else if (raw.startsWith("http")) {
        item.url = raw;
    }
    return item;
}

/**
 * Convert an extracted value + render config into a renderable cell model:
 *   { empty: bool, multi: bool, items: [ {text, entityId?, url?} ] }
 *
 * `multi` cells (entityList / stringList) render comma-separated with a
 * "+N more" tail in the component; scalar cells render their single item.
 *
 * Never throws — an unknown kind or malformed value degrades to text/empty.
 */
export function buildCell(value, render, booleanValues) {
    if (!render || !render.kind) return EMPTY_CELL;
    const kind = render.kind;

    if (isBlank(value)) {
        // Boolean false is meaningful, not blank.
        if (kind === "boolean" && (value === false || value === 0)) {
            return { empty: false, multi: false, items: [textItem(formatBoolean(value, booleanValues))] };
        }
        return EMPTY_CELL;
    }

    switch (kind) {
        case "text":
            return { empty: false, multi: false, items: [stringItem(value, render)] };
        case "number":
            return { empty: false, multi: false, items: [textItem(formatNumber(value, render))] };
        case "year":
            return { empty: false, multi: false, items: [textItem(formatYear(value))] };
        case "currency":
            return { empty: false, multi: false, items: [textItem(formatCurrency(value, render))] };
        case "boolean":
            return { empty: false, multi: false, items: [textItem(formatBoolean(value, booleanValues))] };
        case "date":
            return { empty: false, multi: false, items: [textItem(formatDate(value))] };
        case "code":
            return { empty: false, multi: false, items: [textItem(formatCode(value, render))] };
        case "entityLink": {
            const obj = Array.isArray(value) ? value[0] : value;
            return { empty: false, multi: false, items: [entityItem(obj, render)] };
        }
        case "entityList": {
            const arr = Array.isArray(value) ? value : [value];
            const items = arr.map((o) => entityItem(o, render));
            return { empty: items.length === 0, multi: true, items };
        }
        case "stringList": {
            const arr = Array.isArray(value) ? value : [value];
            // Drop nullish entries before stringifying — otherwise `String(null)`
            // emits "null" and lands in the CSV as a literal string. Server
            // flatten emits empty for the same source, so the parity test
            // surfaces this as a divergence.
            const nonNull = arr.filter((x) => x !== null && x !== undefined);
            // When asked for bare IDs, drop entries with no parseable id.
            const items = render.bareId
                ? nonNull.map((o) => entityIdItem(o, render)).filter(Boolean)
                : nonNull.map((s) => stringItem(s, render));
            return { empty: items.length === 0, multi: true, items };
        }
        default:
            // Unknown kind: degrade to text rather than throw.
            return { empty: false, multi: false, items: [textItem(value)] };
    }
}

/**
 * Flatten a cell model to plain text (CSV export, title attributes).
 * Joins multi-value cells with ", " — the full list, untruncated.
 */
export function cellToText(cell) {
    if (!cell || cell.empty) return "";
    return cell.items.map((i) => i.text).join(", ");
}
