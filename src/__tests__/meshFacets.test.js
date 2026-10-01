// oxjob #1473 — PubMed MeSH filters on works: typed exact-value facets.
import { describe, it, expect } from "vitest";
import { getFacetConfig } from "@/facetConfigUtils";
import { createSimpleFilter, filtersFromUrlStr, filtersAsUrlStr } from "@/filterConfigs";

const KEYS = {
  "mesh.descriptor_name": "MeSH descriptor",
  "mesh.descriptor_ui": "MeSH descriptor ID",
  "mesh.qualifier_name": "MeSH qualifier",
  "mesh.qualifier_ui": "MeSH qualifier ID",
};

describe("MeSH facets", () => {
  it("each is an exact-value works filter labelled like the registry", () => {
    for (const [key, label] of Object.entries(KEYS)) {
      const fc = getFacetConfig("works", key);
      expect(fc.displayName).toBe(label); // label-consistency gate
      expect(fc.type).toBe("search");
      expect(fc.exactValue).toBe(true);
      expect(fc.category).toBe("aboutness");
      expect(fc.actions).toContain("filter");
    }
  });

  it("quotes a multi-word name so the API reads one value, not ANDed words", () => {
    const f = createSimpleFilter("works", "mesh.descriptor_name", "Pregnant Women", false);
    expect(f.asStr).toBe('mesh.descriptor_name:"Pregnant Women"');
    const neg = createSimpleFilter("works", "mesh.descriptor_name", "Pregnant Women", true);
    expect(neg.asStr).toBe('mesh.descriptor_name:!"Pregnant Women"');
    const one = createSimpleFilter("works", "mesh.descriptor_ui", "D001249", false);
    expect(one.asStr).toBe("mesh.descriptor_ui:D001249");
  });

  it("round-trips through the URL without double quotes", () => {
    const url = 'mesh.descriptor_name:"Pregnant Women"';
    const filters = filtersFromUrlStr("works", url);
    expect(filters[0].value).toBe("Pregnant Women");
    expect(filtersAsUrlStr(filters)).toBe(url);
  });

  it("leaves real .search facets unquoted (their value is a raw query)", () => {
    const f = createSimpleFilter("works", "raw_affiliation_strings.search", "harvard medical", false);
    expect(f.asStr).toBe("raw_affiliation_strings.search:harvard medical");
  });
});
