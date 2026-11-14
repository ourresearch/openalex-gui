// oxjob #2065 — parent and child works: works facets, the relationships vocabulary,
// the work page's "Parent work" row and "Parts" metric. `volume` is retired.
import { describe, it, expect } from "vitest";
import { getFacetConfig } from "@/facetConfigUtils";
import { getEntityConfig, metricsPriorityOrder } from "@/entityConfigs";
import * as openalexId from "@/openalexId";
import { entityLinkItems } from "@/components/Entity/entityDatumValues";

const BOOK = { id: "https://openalex.org/W3109397498", display_name: "A book", relationship: "volume" };

describe("parent and child works", () => {
  it("the volume facet is gone; parent work replaces it", () => {
    expect(getFacetConfig("works", "volume.id")).toBeFalsy();
    const fc = getFacetConfig("works", "parent_works.id");
    expect(fc.entityToSelect).toBe("works");
    expect(fc.displayName).toBe("parent work");
    expect(fc.category).toBe("source");
    expect(fc.actions).toEqual(["filter", "group_by"]);
  });

  it("the work page links each parent work, and shows no row when there is none", () => {
    const fc = getFacetConfig("works", "parent_works.id");
    expect(entityLinkItems(fc.extractFn({ parent_works: [BOOK] }))).toEqual([BOOK]);
    expect(fc.extractFn({ parent_works: [] })).toEqual([]);
    const rows = getEntityConfig("works").rowsToShowOnEntityPage;
    expect(rows.indexOf("parent_works.id")).toBe(rows.indexOf("primary_location.source.id") + 1);
  });

  it("the parts metric reads child_works_count and is not dropped from the metrics", () => {
    const fc = getFacetConfig("works", "child_works_count");
    expect(fc.type).toBe("range");
    expect(fc.displayNameOnEntityPage).toBe("parts");
    expect(fc.extractFn({ child_works_count: 12 })).toBe(12);
    expect(getEntityConfig("works").metricsToShowOnEntityPage).toContain("child_works_count");
    expect(metricsPriorityOrder).toContain("child_works_count");
  });

  it("the other works facets carry the API's labels and a category", () => {
    for (const [key, label] of [
      ["parent_works.relationship", "relationship to parent work"],
      ["has_parent_work", "has parent work"],
      ["lineage", "work lineage"],
      ["child_works_count", "child works count"],
    ]) {
      const fc = getFacetConfig("works", key);
      expect(fc.displayName, key).toBe(label);
      expect(fc.category, key).toBe("other");
    }
    expect(getFacetConfig("works", "parent_works.relationship").entityToSelect).toBe("relationships");
    expect(getFacetConfig("works", "lineage").actions).toEqual(["filter"]);
    const rel = getFacetConfig("works", "parent_works.relationship");
    expect(rel.extractFn({ parent_works: [BOOK] })).toEqual(["volume"]);
    expect(getFacetConfig("works", "has_parent_work").extractFn({ parent_works: [] })).toBe(false);
    expect(getFacetConfig("works", "has_parent_work").extractFn({})).toBe(false);
  });

  it("relationships entity filters works by parent_works.relationship", () => {
    const ec = getEntityConfig("relationships");
    expect(ec.filterKey).toBe("parent_works.relationship");
    expect(ec.hasAutocomplete).toBe(false); // /autocomplete/relationships would 404: values load from /relationships
    expect(ec.rowsToShowOnEntityPage).toEqual(["description"]);
    expect(ec.metricsToShowOnEntityPage).toEqual(["works_count"]);
    expect(ec.displayName).toBe("relationships");
  });

  it("relationships has works_count but no cited_by_count facet", () => {
    expect(getFacetConfig("relationships", "works_count")).toBeTruthy();
    expect(getFacetConfig("relationships", "description")).toBeTruthy();
    expect(getFacetConfig("relationships", "cited_by_count")).toBeFalsy();
  });

  it("relationship ids normalize and classify", () => {
    for (const id of [
      "https://openalex.org/relationships/data-series",
      "relationships/data-series",
    ]) {
      expect(openalexId.normalizeId(id)).toBe("relationships/data-series");
      expect(openalexId.getEntityType(id)).toBe("relationships");
    }
  });
});
