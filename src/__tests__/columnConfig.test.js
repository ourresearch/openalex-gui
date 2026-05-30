import { describe, it, expect, vi } from "vitest";
import {
    parseColumnKey,
    resolveColumn,
    resolveColumns,
    deriveColumnRender,
    getColumnExtractFn,
    isColumnEligible,
    getColumnExportSpec,
    getColumnExportSpecs,
} from "@/components/Results/Table/columnConfig";

describe("parseColumnKey", () => {
    it("splits a bare key", () => {
        expect(parseColumnKey("publication_year")).toEqual({
            baseKey: "publication_year",
            variant: null,
        });
    });
    it("splits a :ids-suffixed key", () => {
        expect(parseColumnKey("authorships.author.id:ids")).toEqual({
            baseKey: "authorships.author.id",
            variant: "ids",
        });
    });
});

describe("resolveColumn", () => {
    it("resolves the works identity column (display_name) as an entityLink", () => {
        const col = resolveColumn("works", "display_name");
        expect(col).toMatchObject({
            baseKey: "display_name",
            variant: null,
            isIdentityColumn: true,
            render: { kind: "entityLink" },
        });
    });

    it("resolves an identity column with no explicit column block (authors)", () => {
        // The authors display_name entry declares isIdentityColumn but has no
        // `column` block yet — it must still resolve as an entityLink.
        const col = resolveColumn("authors", "display_name");
        expect(col).toMatchObject({ isIdentityColumn: true, render: { kind: "entityLink" } });
    });

    it("resolves an entityList property (authors)", () => {
        const col = resolveColumn("works", "authorships.author.id");
        expect(col.render.kind).toBe("entityList");
        expect(col.isIdentityColumn).toBe(false);
        expect(typeof col.extractFn).toBe("function");
    });

    it("derives a bare-ID variant from an entity column", () => {
        const col = resolveColumn("works", "authorships.author.id:ids");
        expect(col).toMatchObject({
            key: "authorships.author.id:ids",
            baseKey: "authorships.author.id",
            variant: "ids",
            label: "author IDs",
            render: { kind: "stringList", bareId: true, itemLinkField: "id" },
        });
        // shares the base property's extractFn
        expect(typeof col.extractFn).toBe("function");
    });

    it("carries the base property's actions + facetType (for the header menu)", () => {
        const col = resolveColumn("works", "authorships.author.id");
        expect(Array.isArray(col.actions)).toBe(true);
        // The header menu gates Sort/Filter on these.
        expect(col.actions).toContain("filter");
        expect(typeof col.facetType === "string" || col.facetType === null).toBe(true);
    });

    it(":ids variant inherits the base property's actions + facetType", () => {
        const base = resolveColumn("works", "authorships.author.id");
        const ids = resolveColumn("works", "authorships.author.id:ids");
        // Sort/filter from the header operate on the base property, so both
        // variants expose the same capabilities + type.
        expect(ids.actions).toEqual(base.actions);
        expect(ids.facetType).toBe(base.facetType);
    });

    it("drops an unknown key with a warn (never throws)", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(resolveColumn("works", "nonsense_key_xyz")).toBeNull();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it("drops a :ids variant on a non-entity column with a warn", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(resolveColumn("works", "publication_year:ids")).toBeNull();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it("drops an unknown variant with a warn", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(resolveColumn("works", "authorships.author.id:bogus")).toBeNull();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});

describe("deriveColumnRender (Phase 6 type→render derivation)", () => {
    it("explicit column.render block wins", () => {
        expect(deriveColumnRender({ type: "boolean", column: { render: { kind: "text" } } }))
            .toEqual({ kind: "text" });
    });
    it("identity column → entityLink", () => {
        expect(deriveColumnRender({ type: "search", isIdentityColumn: true }))
            .toEqual({ kind: "entityLink" });
    });
    it("boolean → boolean", () => {
        expect(deriveColumnRender({ type: "boolean", key: "is_retracted" }).kind).toBe("boolean");
    });
    it("selectEntity (no isId) → entityList; isId → stringList", () => {
        expect(deriveColumnRender({ type: "selectEntity", key: "authorships.author.id" }).kind).toBe("entityList");
        expect(deriveColumnRender({ type: "selectEntity", isId: true, key: "authorships.institutions.ror" }).kind).toBe("stringList");
    });
    it("range → number, with year/currency/date special-cases", () => {
        expect(deriveColumnRender({ type: "range", key: "authors_count" }).kind).toBe("number");
        expect(deriveColumnRender({ type: "range", key: "publication_year" }).kind).toBe("year");
        expect(deriveColumnRender({ type: "range", key: "apc_paid.value_usd" }).kind).toBe("currency");
        expect(deriveColumnRender({ type: "range", key: "from_publication_date", isDate: true }).kind).toBe("date");
    });
    it("search type with no explicit block → null (not a column)", () => {
        expect(deriveColumnRender({ type: "search", key: "default.search" })).toBeNull();
    });
});

describe("getColumnExtractFn (scalar dotted-path fallback)", () => {
    it("uses the config's own extractFn when present", () => {
        const fn = () => 42;
        expect(getColumnExtractFn({ type: "range", key: "x", extractFn: fn })).toBe(fn);
    });
    it("synthesizes a dotted-path reader for scalar columns lacking one", () => {
        const fn = getColumnExtractFn({ type: "boolean", key: "open_access.is_oa" });
        expect(typeof fn).toBe("function");
        expect(fn({ open_access: { is_oa: true } })).toBe(true);
        expect(fn({})).toBeUndefined(); // missing path → blank cell, never throws
        expect(fn(null)).toBeUndefined();
    });
    it("returns null for entity columns with no extractFn (can't synthesize objects)", () => {
        expect(getColumnExtractFn({ type: "selectEntity", key: "authorships.author.id" })).toBeNull();
    });
});

describe("isColumnEligible", () => {
    it("real works boolean with no extractFn is eligible via path fallback", () => {
        // `is_retracted` (works) is a boolean facet with no extractFn — Phase 6
        // makes it a column via the dotted-path reader.
        expect(isColumnEligible({ type: "boolean", key: "is_retracted", entityToFilter: "works" })).toBe(true);
    });
    it("pure search facet is NOT eligible", () => {
        expect(isColumnEligible({ type: "search", key: "default.search" })).toBe(false);
    });
    it("is_xpac is excluded", () => {
        expect(isColumnEligible({ type: "boolean", key: "is_xpac" })).toBe(false);
    });
    it("selectEntity without extractFn is NOT eligible (no object source)", () => {
        expect(isColumnEligible({ type: "selectEntity", key: "some.entity.filter" })).toBe(false);
    });
});

describe("resolveColumns", () => {
    it("keeps valid columns in order and drops invalid ones (Test 11)", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const cols = resolveColumns("works", [
            "nonsense_key_xyz",
            "publication_year",
            "authorships.author.id",
        ]);
        expect(cols.map((c) => c.key)).toEqual([
            "publication_year",
            "authorships.author.id",
        ]);
        warn.mockRestore();
    });

    it("returns [] for non-array input (never throws)", () => {
        expect(resolveColumns("works", null)).toEqual([]);
        expect(resolveColumns("works", undefined)).toEqual([]);
    });
});

describe("getColumnExportSpec (#304)", () => {
    it("identity column → path 'display_name' + label as header (capitalized to match table)", () => {
        const spec = getColumnExportSpec("works", "display_name");
        expect(spec).toEqual({ path: "display_name", header: "Title" });
    });

    it("scalar column → path = baseKey (capitalized header)", () => {
        const spec = getColumnExportSpec("works", "publication_year");
        expect(spec).toEqual({ path: "publication_year", header: "Year" });
    });

    it("nested scalar (boolean) → dotted path = baseKey", () => {
        const spec = getColumnExportSpec("works", "open_access.is_oa");
        expect(spec?.path).toBe("open_access.is_oa");
    });

    it("entityList column → path swaps trailing '.id' for '.display_name'", () => {
        // authorships.author.id → entityList of author objects → CSV shows names.
        const spec = getColumnExportSpec("works", "authorships.author.id");
        expect(spec?.path).toBe("authorships.author.display_name");
    });

    it(":ids variant → path = baseKey (the bare-ID flat-path)", () => {
        const spec = getColumnExportSpec("works", "authorships.author.id:ids");
        expect(spec?.path).toBe("authorships.author.id");
        expect(spec?.header).toBe("Author IDs");
    });

    it("override path + recipe (institutions: lineage key, display_name path, unique recipe)", () => {
        // The institution column's filter key is `lineage`, but the column
        // renders deduped institutions — explicit override + unique recipe.
        const spec = getColumnExportSpec("works", "authorships.institutions.lineage");
        expect(spec).toMatchObject({
            path: "authorships.institutions.display_name",
            recipe: "unique",
        });
    });

    it(":ids variant auto-swaps the trailing label segment for the link field", () => {
        // institution :ids derived from override path; .display_name → .id.
        const spec = getColumnExportSpec("works", "authorships.institutions.lineage:ids");
        expect(spec).toMatchObject({
            path: "authorships.institutions.id",
            recipe: "unique",
        });
    });

    it("recipe applies to both variants without a path override (funders)", () => {
        // funders.id has only `recipe: 'unique'` — path auto-derives.
        const names = getColumnExportSpec("works", "funders.id");
        const ids = getColumnExportSpec("works", "funders.id:ids");
        expect(names?.path).toBe("funders.display_name");
        expect(names?.recipe).toBe("unique");
        expect(ids?.path).toBe("funders.id");
        expect(ids?.recipe).toBe("unique");
    });

    it("returns null for an unknown column key", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(getColumnExportSpec("works", "no_such_thing")).toBeNull();
        warn.mockRestore();
    });

    it("abstract column maps to the server's pre-flatten `abstract` field (works)", () => {
        // Server csv.py pre-computes flat['abstract'] from
        // abstract_inverted_index for works — so path = "abstract" works
        // with no recipe.
        const spec = getColumnExportSpec("works", "abstract");
        expect(spec?.path).toBe("abstract");
        expect(spec?.recipe).toBeUndefined();
    });

    it("ROR ID column (stringList, isId) → path = key", () => {
        const spec = getColumnExportSpec("works", "authorships.institutions.ror");
        expect(spec?.path).toBe("authorships.institutions.ror");
    });
});

describe("getColumnExportSpecs (ordered list, drops unresolved)", () => {
    it("preserves order and drops unresolved keys", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const specs = getColumnExportSpecs("works", [
            "display_name",
            "no_such_key",
            "publication_year",
        ]);
        expect(specs.map((s) => s.path)).toEqual(["display_name", "publication_year"]);
        warn.mockRestore();
    });

    it("returns [] for non-array input", () => {
        expect(getColumnExportSpecs("works", null)).toEqual([]);
    });
});
