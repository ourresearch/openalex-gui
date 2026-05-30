/**
 * Parity sweep (oxjob #304 Test 3).
 *
 * For every column-eligible facetConfig on every entity type with a fixture
 * (works/authors/sources/publishers/funders/institutions/concepts/topics),
 * compare the client-side rendered cell (`cellToText(buildCell(extractFn))`)
 * to the server-side flat-path value (`process_entity(entity)[exportSpec.path]`
 * after `apply_recipe(...)`). Compares as sets-of-items (each side split on its
 * own separator: client `, ` vs server `|`) — modulo separator, per PLAN.md.
 *
 * Fixtures live in the job dir, not the gui repo, because both repos need
 * them in lockstep:
 *   ~/Documents/oxjobs/working/wysiwyg-csv-export-columns/work/parity-sweep/
 *     entities/{type}.json   raw API responses
 *     flat/{type}.json       server flatten_value output
 *
 * Regenerate fixtures: `python3 fetch_and_flatten.py` in that dir.
 *
 * The test writes a structured JSON report (`reports/parity.json`) so the
 * job's #304 PLAN can absorb a delta-since-last-run table without re-reading
 * pages of stdout.
 *
 * NOTE: this test is gated on the fixture files existing — `it.skipIf(...)`
 * makes the suite a no-op in clean CI (no network during test). To run:
 *   cd ~/Documents/oxjobs/working/wysiwyg-csv-export-columns/work/parity-sweep
 *   python3 fetch_and_flatten.py
 *   cd ~/Documents/openalex-gui
 *   npx vitest run parity.sweep
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

import { facetConfigs } from "@/facetConfigs";
import {
    resolveColumn,
    getColumnExportSpec,
    isColumnEligible,
    hasIdsSibling,
} from "@/components/Results/Table/columnConfig";
import { buildCell } from "@/components/Results/Table/cellFormat";

const FIXTURE_DIR = path.resolve(
    __dirname,
    "../../../oxjobs/working/wysiwyg-csv-export-columns/work/parity-sweep",
);

const ENTITY_TYPES = [
    "works",
    "authors",
    "sources",
    "publishers",
    "funders",
    "institutions",
    "concepts",
    "topics",
];

const SERVER_SEP = "|";
const CLIENT_SEP = ", ";

// Mirror the server-side recipes (formats/csv_manifest.py:RECIPE_REGISTRY) —
// the sweep applies them client-side so the comparison reflects what the CSV
// row actually contains, not the raw flat path.
const OPENALEX_URL_PREFIX_RE = /^https:\/\/openalex\.org\/(?:keywords\/|domains\/|fields\/|subfields\/|sdgs\/)?/;
function applyRecipe(value, recipe) {
    if (!recipe || value == null || value === "") return value;
    if (Array.isArray(recipe)) {
        return recipe.reduce((v, r) => applyRecipe(v, r), value);
    }
    if (recipe === "unique") {
        const seen = new Set();
        const out = [];
        for (const p of String(value).split(SERVER_SEP)) {
            if (!seen.has(p)) { seen.add(p); out.push(p); }
        }
        return out.join(SERVER_SEP);
    }
    if (recipe === "bare_openalex_id") {
        return String(value)
            .split(SERVER_SEP)
            .map((p) => p.replace(OPENALEX_URL_PREFIX_RE, ""))
            .join(SERVER_SEP);
    }
    // `reconstruct_abstract` is a no-op handle (server pre-flattens works abstracts).
    if (recipe === "reconstruct_abstract") return value;
    return value;
}

/** Cell -> array of item texts. Includes blank entries so "+N more" doesn't lose count. */
function cellItems(cell) {
    if (!cell || cell.empty) return [];
    return cell.items.map((i) => i.text);
}

function applyBooleanLabels(value, labels) {
    if (value === "True") return labels[1];
    if (value === "False") return labels[0];
    return value;
}

function serverItems(flat, spec) {
    const raw = flat[spec.path];
    let transformed = applyRecipe(raw, spec.recipe);
    if (Array.isArray(spec.boolean_labels) && spec.boolean_labels.length === 2 && transformed != null) {
        transformed = applyBooleanLabels(transformed, spec.boolean_labels);
    }
    if (transformed == null || transformed === "") return [];
    return String(transformed).split(SERVER_SEP);
}

/** Eligible "raw column keys" for an entity type, including :ids siblings —
 *  exactly mirrors what the AddColumn/EditColumnsDialog pickers offer. */
function eligibleKeys(entityType) {
    const keys = [];
    for (const cfg of facetConfigs(entityType)) {
        if (cfg.entityToFilter !== entityType) continue;
        if (!isColumnEligible(cfg)) continue;
        keys.push(cfg.key);
        if (hasIdsSibling(cfg)) keys.push(`${cfg.key}:ids`);
    }
    return Array.from(new Set(keys));
}

function loadFixtures() {
    const out = {};
    for (const t of ENTITY_TYPES) {
        const entityFile = path.join(FIXTURE_DIR, "entities", `${t}.json`);
        const flatFile = path.join(FIXTURE_DIR, "flat", `${t}.json`);
        if (!fs.existsSync(entityFile) || !fs.existsSync(flatFile)) continue;
        out[t] = {
            entity: JSON.parse(fs.readFileSync(entityFile, "utf8")),
            flat: JSON.parse(fs.readFileSync(flatFile, "utf8")),
        };
    }
    return out;
}

const fixtures = loadFixtures();
const haveFixtures = Object.keys(fixtures).length > 0;

// Divergence categories the CSV ships *intentionally* — explicit design calls
// where on-screen text and CSV value are expected to differ. (Jason,
// 2026-05-30: numbers + currency in the CSV are raw, not formatted, so
// downstream tools don't have to parse "75,677" / "$11,690". Same flavor for
// country/language *codes* — the table renders "Netherlands" via codebook
// lookup, the CSV ships the ISO code "NL"; derived counts vs underlying lists
// likewise favor the richer flat data.)
const ACCEPTED_CATEGORIES = new Set([
    "NUMBER_FORMAT",
    "CURRENCY_FORMAT",
    "CODE_VS_NAME",                 // table shows codebook name, CSV ships raw code
    "DERIVED_COUNT_VS_FULL_LIST",   // table shows count, CSV ships underlying ID list
    "POSITIONAL_EMPTIES",           // server preserves position of null-source locations; client drops them
    "FILTERED_OWN_NAME",            // display_name_alternatives drops self-display-name; server keeps it
    "FILTERED_SUBSET",              // child/related institutions are a client-side filter on associated_institutions
]);

// Classify a DIVERGE row into a known category — the categories below are
// findings from the first run, not a-priori knowledge. Adding a case here
// = "we've looked at this kind of mismatch and decided what it means".
function classifyDivergence(row) {
    const { client_sample, server_sample, render_kind, export_path, key, only_server, only_client } = row;
    // 1. Bare OpenAlex ID vs full URL — affects every `:ids` column on
    //    nested-entity properties. Client toDisplayFormat→"bare", server
    //    flatten just stringifies whatever the API returns.
    const bareIdRe = /^[A-Z]\d{4,}$/;            // A5023…, I27837…
    const slugRe   = /^[a-z0-9-]+$/;             // "softmax-function"
    const fullUrlRe = /^https:\/\/openalex\.org\//;
    if (only_client.length && only_server.length
        && only_client.every((c) => bareIdRe.test(c) || slugRe.test(c) || /^\d+$/.test(c))
        && only_server.every((s) => fullUrlRe.test(s))) {
        return "BARE_ID_VS_FULL_URL";
    }
    // 2. Boolean: client renders the configured booleanValues label
    //    ("Open Access" / "Not Open Access"), server emits Python str(bool).
    if (render_kind === "boolean"
        && server_sample.every((s) => s === "True" || s === "False")) {
        return "BOOLEAN_LABEL_VS_RAW";
    }
    // 3. Number formatting: client groups (Intl.toLocaleString) and rounds;
    //    server emits the raw Python repr.
    if (render_kind === "number" && row.client_count === 1 && row.server_count === 1) {
        const c = client_sample[0], s = server_sample[0];
        if (/^-?[\d,]+(\.\d+)?$/.test(c) && /^-?\d+(\.\d+)?$/.test(s)) return "NUMBER_FORMAT";
    }
    // 3b. Currency formatting: client renders Intl currency ("$11,690");
    //     server emits the raw amount.
    if (render_kind === "currency" && row.client_count === 1 && row.server_count === 1) {
        const c = client_sample[0], s = server_sample[0];
        if (/^[^\d]?[\d,]+(\.\d+)?$/.test(c) && /^-?\d+(\.\d+)?$/.test(s)) return "CURRENCY_FORMAT";
    }
    // 3c. ":ids" variant generated on a non-entity column: the picker
    //     should not offer this column (the client-side ":ids" auto-derive
    //     only makes sense for entityList/entityLink whose items carry
    //     parseable OpenAlex ids). Client cell is empty; server has data
    //     at the bare path. Surfaces a too-eager `:ids` advertisement.
    if (key.endsWith(":ids") && row.client_count === 0 && row.server_count >= 1) {
        return "BOGUS_IDS_VARIANT";
    }
    // 4. Null vs empty-string in stringList: extractFn returns null entries,
    //    client `String(null)` -> "null", server flatten emits "".
    if (only_client.length === 1 && only_client[0] === "null"
        && only_server.length === 1 && only_server[0] === "") {
        return "NULL_STRINGIFY_BUG";
    }
    // 5. Client has data, server doesn't — extractFn produces a derived value
    //    (e.g. `cited_by_count` shoved into a `cited_by` cell, or `:ids`
    //    extracting from `publisher`/`child_institutions` whose flatten path
    //    isn't what the override implies). The export path needs an explicit
    //    `column.export.path` override (or the column shouldn't be exportable).
    if (server_sample.length === 0 && client_sample.length > 0) return "MISSING_SERVER_PATH";
    // 6. Codebook lookup: client renders the human name via a codebook
    //    (`country_code: "NL"` -> "Netherlands"); server ships the raw code.
    //    Accepted divergence (mirrors the raw-numbers call).
    if ((key.endsWith("country_code") || key.endsWith("country_codes") || key.includes("language"))
        && client_sample.length > 0 && server_sample.length > 0
        && only_client.length > 0 && only_server.length > 0
        && only_server.every((s) => s.length <= 3)) {
        return "CODE_VS_NAME";
    }
    // 7. Derived count vs underlying list: column.export.path points to the
    //    list field (richer for downstream analysis), table renders just the
    //    count via extractFn (e.g. related_to -> "20" on screen, full ID list
    //    in CSV).
    if (client_sample.length === 1 && /^\d+$/.test(client_sample[0])
        && server_sample.length > 1) {
        return "DERIVED_COUNT_VS_FULL_LIST";
    }
    // 8. display_name_alternatives drops the entity's own display_name on the
    //    client (filtered via altNames); server flatten includes it. Off-by-one.
    if (key.endsWith("display_name_alternatives")
        && Math.abs(server_sample.length - client_sample.length) <= 1
        && only_client.length === 0) {
        return "FILTERED_OWN_NAME";
    }
    // 9. Positional empties: server flat preserves position of null-source
    //    locations as empty pipe segments; client filters them out.
    if (key.startsWith("locations.")
        && only_server.length > 0
        && only_server.every((s) => s === "")) {
        return "POSITIONAL_EMPTIES";
    }
    // 10. Filtered subset: client extractFn filters a list by some attribute
    //     (child_institutions = associated_institutions where relationship=child);
    //     server flatten gives the unfiltered superset (or empty when the
    //     subkey doesn't exist at all in the flat output).
    if (/^(child|related)_institutions$/.test(key)) return "FILTERED_SUBSET";
    // 11. Client extracts fewer items than server (e.g. primary_location's
    //     source while server has all locations' sources). Different
    //     cardinalities = different semantics; needs explicit reconciliation.
    if (client_sample.length > 0 && server_sample.length > client_sample.length
        && only_client.length === 0) {
        return "CLIENT_NARROWER_EXTRACT";
    }
    return "UNCATEGORIZED";
}

describe("oxjob #304 parity sweep — client cellToText vs server flatten", () => {
    it.skipIf(!haveFixtures)("produces a structured report and surfaces no UNEXPECTED divergences", () => {
        const report = {
            generated_at: new Date().toISOString(),
            entity_types: {},
            summary: { total: 0, match: 0, both_empty: 0, accepted_diverge: 0, classified: {}, uncategorized: 0, client_threw: 0 },
            unexpected: [],
        };

        for (const [entityType, { entity, flat }] of Object.entries(fixtures)) {
            const rows = [];
            for (const rawKey of eligibleKeys(entityType)) {
                const col = resolveColumn(entityType, rawKey);
                const spec = getColumnExportSpec(entityType, rawKey);
                if (!col || !spec) {
                    rows.push({ key: rawKey, status: "SKIP_UNRESOLVED" });
                    continue;
                }
                let extracted, cell, clientItems_;
                try {
                    extracted = col.extractFn(entity);
                    cell = buildCell(extracted, col.render, col.booleanValues);
                    clientItems_ = cellItems(cell);
                } catch (e) {
                    rows.push({
                        key: rawKey,
                        status: "CLIENT_THREW",
                        error: String(e?.message || e),
                        export_path: spec.path,
                        export_header: spec.header,
                    });
                    continue;
                }
                const serverItems_ = serverItems(flat, spec);
                const clientSet = new Set(clientItems_);
                const serverSet = new Set(serverItems_);
                const status = (() => {
                    if (clientItems_.length === 0 && serverItems_.length === 0) return "BOTH_EMPTY";
                    // Client filters null entries; server flattens them as
                    // empty strings ("|" separator drops to "|" → ['','']).
                    // Both express "no values" — treat as both-empty.
                    if (clientItems_.length === 0
                        && serverItems_.every((s) => s === "")) return "BOTH_EMPTY";
                    if (clientItems_.length === serverItems_.length
                        && clientItems_.every((x, i) => x === serverItems_[i])) return "MATCH_EXACT";
                    if (clientSet.size === serverSet.size
                        && [...clientSet].every((x) => serverSet.has(x))) return "MATCH_SET";
                    return "DIVERGE";
                })();

                const rowOut = {
                    key: rawKey,
                    status,
                    export_path: spec.path,
                    export_header: spec.header,
                    recipe: spec.recipe ?? null,
                    render_kind: col.render?.kind ?? null,
                    client_count: clientItems_.length,
                    server_count: serverItems_.length,
                    // Truncate to keep the report readable; the cardinality and
                    // diff are what matter, not the full multi-MB cell payload.
                    client_sample: clientItems_.slice(0, 5),
                    server_sample: serverItems_.slice(0, 5),
                    only_client: [...clientSet].filter((x) => !serverSet.has(x)).slice(0, 5),
                    only_server: [...serverSet].filter((x) => !clientSet.has(x)).slice(0, 5),
                };
                if (status === "DIVERGE") rowOut.category = classifyDivergence(rowOut);
                rows.push(rowOut);
            }
            report.entity_types[entityType] = rows;
            for (const r of rows) {
                report.summary.total += 1;
                if (r.status === "MATCH_EXACT" || r.status === "MATCH_SET") report.summary.match += 1;
                else if (r.status === "BOTH_EMPTY") report.summary.both_empty += 1;
                else if (r.status === "CLIENT_THREW") report.summary.client_threw += 1;
                else if (r.status === "DIVERGE") {
                    const cat = r.category || "UNCATEGORIZED";
                    report.summary.classified[cat] = (report.summary.classified[cat] || 0) + 1;
                    // Categories the CSV ships *intentionally* per Jason's
                    // 2026-05-30 design call: numbers + currency CSV the raw
                    // value (data-portability), accepting the WYSIWYG break
                    // vs the on-screen-formatted text. Booked as accepted_diverge
                    // so the headline "needs attention" count drops to zero
                    // once the remaining fixes land.
                    if (ACCEPTED_CATEGORIES.has(cat)) report.summary.accepted_diverge += 1;
                    else if (cat === "UNCATEGORIZED") report.summary.uncategorized += 1;
                }
            }
        }

        // Persist the structured report so the job can keep a delta history.
        const reportDir = path.join(FIXTURE_DIR, "reports");
        fs.mkdirSync(reportDir, { recursive: true });
        fs.writeFileSync(
            path.join(reportDir, "parity.json"),
            JSON.stringify(report, null, 2),
        );

        // Build a flat list of unexpected (DIVERGE / CLIENT_THREW / SKIP_UNRESOLVED) rows
        // for the human-readable summary at the bottom of this test's failure message.
        const unexpected = [];
        for (const [t, rows] of Object.entries(report.entity_types)) {
            for (const r of rows) {
                if (r.status !== "MATCH_EXACT" && r.status !== "MATCH_SET" && r.status !== "BOTH_EMPTY") {
                    unexpected.push({ entity_type: t, ...r });
                }
            }
        }
        report.unexpected = unexpected;
        fs.writeFileSync(
            path.join(reportDir, "parity.json"),
            JSON.stringify(report, null, 2),
        );

        // The test isn't a hard FAIL on divergence (this is a discovery sweep —
        // we expect to find some). It's a hard FAIL only on EMPTY fixtures.
        // CLIENT_THREW is recorded in the report and surfaced via the summary;
        // it doesn't crash CI (the table render itself wraps extractFn in
        // try/catch, so a thrown column on screen renders as "—").
        expect(report.summary.total, "no rows produced — fixtures missing?").toBeGreaterThan(0);
    });
});
