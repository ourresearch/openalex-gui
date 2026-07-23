// oxjob #505 — invariants the unified field pickers depend on. The OQL "All
// fields" dialog, the filter selector, and the column selector all read
// facetsByCategory(); these assertions lock the curated taxonomy that makes the
// duplicate / "Other"-dumping / no-Search-category complaints go away.
import { describe, it, expect } from "vitest";
import { facetsByCategory } from "@/facetConfigUtils";
import { facetConfigs } from "@/facetConfigs";
import { ALL_ENTITY_TYPES } from "@/openalexId";

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
    expect(geoKeys).toContain("authorships.institutions.is_global_south");
    const otherKeys = (byName.other?.items ?? []).map((i) => i.key);
    expect(otherKeys).not.toContain("authorships.institutions.is_global_south");
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

// oxjob #621 — the advanced builder is wired for ALL 23 entities, and the D3
// picker-config defects (#620) are fixed. These lock the invariants so the
// builder can't silently regress to the 8-entity allowlist or re-introduce the
// duplicate / dropped / mistyped facet bugs.
describe("facet picker (all entities — #621)", () => {
  it("ALL_ENTITY_TYPES covers the full 23 non-works + works vocabulary", () => {
    // 22 non-works entities + works = 23 browsable entity types.
    expect(ALL_ENTITY_TYPES).toContain("works");
    for (const e of [
      "authors", "sources", "publishers", "funders", "institutions", "concepts",
      "keywords", "topics", "subfields", "fields", "domains", "sdgs", "countries",
      "continents", "languages", "types", "source-types", "institution-types",
      "licenses", "oa-statuses", "locations", "awards",
    ]) {
      expect(ALL_ENTITY_TYPES, `missing entity ${e}`).toContain(e);
    }
    expect(ALL_ENTITY_TYPES.length).toBe(23);
  });

  // Every entity the builder can drive must offer at least one buildable filter,
  // or the builder renders present-but-empty. (#621 gave locations is_oa/source_id/
  // work_id filter actions, so it's no longer an exception.)
  for (const entity of ALL_ENTITY_TYPES) {
    it(`${entity}: builder picker exposes >=1 filter and no duplicate keys`, () => {
      const cats = oqlPickerCategories(entity);
      const keys = cats.flatMap((c) => c.items.map((i) => i.key));
      expect(keys.length, `${entity} has no buildable filters`).toBeGreaterThan(0);
      const seen = new Set();
      for (const k of keys) {
        expect(seen.has(k), `${entity} duplicate picker key: ${k}`).toBe(false);
        seen.add(k);
      }
    });
  }

  it("funders picker has no duplicate works_count / cited_by_count rows", () => {
    const keys = oqlPickerCategories("funders").flatMap((c) => c.items.map((i) => i.key));
    expect(keys.filter((k) => k === "works_count").length).toBe(1);
    expect(keys.filter((k) => k === "cited_by_count").length).toBe(1);
  });

  it("awards picker has no duplicate start_year / end_year rows", () => {
    const keys = oqlPickerCategories("awards").flatMap((c) => c.items.map((i) => i.key));
    expect(keys.filter((k) => k === "start_year").length).toBe(1);
    expect(keys.filter((k) => k === "end_year").length).toBe(1);
  });

  it("publishers picker includes continent; institutions picker includes lineage", () => {
    const pub = oqlPickerCategories("publishers").flatMap((c) => c.items.map((i) => i.key));
    expect(pub).toContain("continent");
    const inst = oqlPickerCategories("institutions").flatMap((c) => c.items.map((i) => i.key));
    expect(inst).toContain("lineage");
  });

  it("continent and topics.id have a consistent type across every entity", () => {
    for (const key of ["continent", "topics.id"]) {
      const types = new Set(
        ALL_ENTITY_TYPES
          .flatMap((e) => facetConfigs(e))
          .filter((c) => c.key === key)
          .map((c) => c.type),
      );
      expect(types, `${key} typed inconsistently: ${[...types].join(", ")}`).toEqual(
        new Set(["selectEntity"]),
      );
    }
  });
});
