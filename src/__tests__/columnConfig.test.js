import { describe, it, expect, vi } from "vitest";
import {
    parseColumnKey,
    resolveColumn,
    resolveColumns,
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
    it("resolves the mandatory works identity column as an entityLink", () => {
        const col = resolveColumn("works", "display_name");
        expect(col).toMatchObject({
            baseKey: "display_name",
            variant: null,
            isColumnMandatory: true,
            render: { kind: "entityLink" },
        });
    });

    it("resolves a mandatory identity column with no explicit column block (authors)", () => {
        // The authors display_name entry declares isColumnMandatory but has no
        // `column` block yet — it must still resolve as an entityLink.
        const col = resolveColumn("authors", "display_name");
        expect(col).toMatchObject({ isColumnMandatory: true, render: { kind: "entityLink" } });
    });

    it("resolves an entityList property (authors)", () => {
        const col = resolveColumn("works", "authorships.author.id");
        expect(col.render.kind).toBe("entityList");
        expect(col.isColumnMandatory).toBe(false);
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
