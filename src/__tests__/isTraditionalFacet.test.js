// oxjob #2064: the works facet `is_traditional` (a yes/no derived from the
// work's type by elastic-api). Locks the shape the filter dialog, column picker
// and group-by need, and the label elastic-api's label-consistency gate checks.
import { describe, it, expect } from "vitest";
import { facetConfigs } from "@/facetConfigs";
import { getFacetConfig, facetsByCategory } from "@/facetConfigUtils";
import { isColumnEligible, resolveColumn } from "@/components/Results/Table/columnConfig";

describe("works facet is_traditional", () => {
  const config = getFacetConfig("works", "is_traditional");

  it("exists on works with the registry's label", () => {
    expect(config).toBeTruthy();
    expect(config.entityToFilter).toBe("works");
    expect(config.type).toBe("boolean");
    expect(config.category).toBe("other");
    expect(config.displayName.toLowerCase()).toBe("traditional scholarly work");
    expect(config.booleanValues).toEqual([
      "Not a traditional scholarly work",
      "Traditional scholarly work",
    ]);
    expect(config.actions).toEqual(expect.arrayContaining(["filter", "column", "group_by"]));
  });

  it("is a works-only facet", () => {
    for (const entity of ["authors", "sources", "institutions"]) {
      expect(facetConfigs(entity).some((c) => c.key === "is_traditional")).toBe(false);
    }
  });

  it("shows in the picker under Other", () => {
    const other = facetsByCategory("works", "", ["boolean"], []).find(
      (cat) => cat.displayName === "other",
    );
    expect(other.filterConfigs.map((c) => c.key)).toContain("is_traditional");
  });

  it("works as a table column that reads the work's own value", () => {
    expect(isColumnEligible(config)).toBe(true);
    const col = resolveColumn("works", "is_traditional");
    expect(col.render.kind).toBe("boolean");
    expect(col.extractFn({ is_traditional: true })).toBe(true);
    expect(col.extractFn({ is_traditional: false })).toBe(false);
  });
});
