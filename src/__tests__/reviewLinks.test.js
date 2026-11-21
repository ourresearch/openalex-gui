// oxjob #2481 — review links and the link-types rename: works facets for reviewed_by_count and
// parent_works.link_type (the new name of parent_works.relationship). Labels equal the API registry's.
import { describe, it, expect } from "vitest";
import { getFacetConfig } from "@/facetConfigUtils";

const BOOK = { id: "https://openalex.org/W3109397498", display_name: "A book", relationship: "volume", link_type: "volume" };

describe("review links", () => {
  it("reviewed_by_count is a citation range facet beside cited_by_count", () => {
    const fc = getFacetConfig("works", "reviewed_by_count");
    expect(fc.displayName).toBe("reviewed by count");
    expect(fc.type).toBe("range");
    expect(fc.category).toBe("citation");
    expect(fc.actions).toEqual(["filter", "sort", "column"]);
    expect(fc.extractFn({ reviewed_by_count: 3 })).toBe(3);
    expect(fc.column.export.path).toBe("reviewed_by_count");
  });

  it("parent_works.link_type mirrors parent_works.relationship", () => {
    const lt = getFacetConfig("works", "parent_works.link_type");
    const rel = getFacetConfig("works", "parent_works.relationship");
    expect(lt.displayName).toBe("link type to parent work");
    expect(rel.displayName).toBe("relationship to parent work");
    for (const key of ["entityToSelect", "type", "category", "actions"]) {
      expect(lt[key], key).toEqual(rel[key]);
    }
    expect(lt.extractFn({ parent_works: [BOOK] })).toEqual(["volume"]);
    expect(lt.extractFn({ parent_works: [{ ...BOOK, link_type: undefined }] })).toEqual(["volume"]);
    expect(lt.extractFn({})).toEqual([]);
  });
});
