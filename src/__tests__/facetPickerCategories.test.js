// oxjob #505 — invariants the unified field pickers depend on. The OQL "All
// fields" dialog, the filter selector, and the column selector all read
// facetsByCategory(); these assertions lock the curated taxonomy that makes the
// duplicate / "Other"-dumping / no-Search-category complaints go away.
import { describe, it, expect } from "vitest";
import { facetsByCategory } from "@/facetConfigUtils";

// Mirror the OQL "All fields" dialog's category build (BuilderFieldDialog.vue):
// filter-action facets, is_xpac excluded, hideFromPicker already dropped by
// facetsByCategory.
function oqlPickerCategories(entity) {
  return facetsByCategory(entity, "", ["selectEntity", "boolean", "range", "search"], [])
    .map((cat) => ({
      displayName: cat.displayName,
      items: cat.filterConfigs
        .filter((fc) => fc.actions?.includes("filter") && fc.key !== "is_xpac")
        .map((fc) => ({ key: fc.key, label: fc.displayName })),
    }))
    .filter((cat) => cat.items.length);
}

describe("facet picker categories (works)", () => {
  const cats = oqlPickerCategories("works");
  const byName = Object.fromEntries(cats.map((c) => [c.displayName, c]));
  const allKeys = cats.flatMap((c) => c.items.map((i) => i.key));

  it("has a Search category with the text-search surfaces", () => {
    expect(byName.search).toBeTruthy();
    const keys = byName.search.items.map((i) => i.key);
    expect(keys).toContain("display_name.search"); // title
    expect(keys).toContain("title_and_abstract.search");
    expect(keys).toContain("fulltext.search");
  });

  it("hides the redundant title.search alias from the picker", () => {
    expect(allKeys).not.toContain("title.search");
  });

  it("never lists is_xpac (deprecated)", () => {
    expect(allKeys).not.toContain("is_xpac");
  });

  it("puts 'institution is in Global South' under Geo, not Other", () => {
    const geoKeys = (byName.geo?.items ?? []).map((i) => i.key);
    expect(geoKeys).toContain("institutions.is_global_south");
    const otherKeys = (byName.other?.items ?? []).map((i) => i.key);
    expect(otherKeys).not.toContain("institutions.is_global_south");
  });

  it("has no facet in two categories", () => {
    const seen = new Set();
    for (const k of allKeys) {
      expect(seen.has(k), `duplicate key across categories: ${k}`).toBe(false);
      seen.add(k);
    }
  });

  it("has no two facets sharing a display name within the picker", () => {
    const labels = cats.flatMap((c) => c.items.map((i) => i.label.toLowerCase()));
    const dupes = labels.filter((l, i) => labels.indexOf(l) !== i);
    expect(dupes, `duplicate labels: ${[...new Set(dupes)].join(", ")}`).toEqual([]);
  });
});
