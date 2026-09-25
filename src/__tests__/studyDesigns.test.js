// oxjob #1312 — the study-designs vocabulary: works facet, entity config, ids.
import { describe, it, expect } from "vitest";
import { getFacetConfig } from "@/facetConfigUtils";
import { getEntityConfig } from "@/entityConfigs";
import * as openalexId from "@/openalexId";

describe("study designs", () => {
  it("works facet filters study_designs.id from the study-designs entity", () => {
    const fc = getFacetConfig("works", "study_designs.id");
    expect(fc.entityToSelect).toBe("study-designs");
    // label-consistency gate: must equal the registry display_name
    expect(fc.displayName).toBe("study design");
    expect(fc.category).toBe("aboutness");
    expect(fc.actions).toEqual(expect.arrayContaining(["filter", "group_by"]));
    const rows = [{ id: "https://openalex.org/study-designs/meta-analysis", display_name: "Meta-Analysis" }];
    expect(fc.extractFn({ study_designs: rows })).toEqual(rows);
  });

  it("shows on the work page, next to type", () => {
    const rows = getEntityConfig("works").rowsToShowOnEntityPage;
    expect(rows.indexOf("study_designs.id")).toBe(rows.indexOf("type") + 1);
  });

  it("entity config filters works by study_designs.id", () => {
    const ec = getEntityConfig("study-designs");
    expect(ec.filterKey).toBe("study_designs.id");
    expect(ec.isNative).toBe(false);
  });

  it("full, short and bare ids normalize to the namespaced form", () => {
    for (const id of [
      "https://openalex.org/study-designs/meta-analysis",
      "study-designs/meta-analysis",
    ]) {
      expect(openalexId.normalizeId(id)).toBe("study-designs/meta-analysis");
      expect(openalexId.getEntityType(id)).toBe("study-designs");
      expect(openalexId.getShortId(id)).toBe("meta-analysis");
    }
  });

  it("gets the standard injected count facets", () => {
    expect(getFacetConfig("study-designs", "cited_by_count")).toBeTruthy();
    expect(getFacetConfig("study-designs", "works_count")).toBeTruthy();
  });
});
