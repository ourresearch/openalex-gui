// oxjob #655: alias filter keys fold to canonical on input. Old URLs and saved
// searches keep working, and chips, re-serialized URLs and the Basic-mode gate
// all see the canonical key the server echoes in meta.x_query.url.
import { describe, it, expect } from "vitest";
import { filtersFromUrlStr, filtersAsUrlStr } from "@/filterConfigs";
import { getFacetConfig, canonicalFilterKey } from "@/facetConfigUtils";
import { basicCanRepresent, facetTypeToChipType } from "@/components/Filter/basicFilterMode";

const roundTrip = (entityType, str) =>
  filtersAsUrlStr(filtersFromUrlStr(entityType, str));

describe("alias filter keys (#655)", () => {
  it.each([
    ["openalex:W2741809807", "ids.openalex:w2741809807"],
    ["author.id:A5041041439", "authorships.author.id:a5041041439"],
    ["is_oa:true", "open_access.is_oa:true"],
    ["institutions.id:I33213144", "authorships.institutions.id:i33213144"],
    ["institutions.ror:https://ror.org/02y3ad647", "authorships.institutions.ror:https://ror.org/02y3ad647"],
    ["cites:W2741809807", "referenced_works:w2741809807"],
  ])("works %s renders a chip, stays in Basic, re-serializes canonical", (alias, canonical) => {
    const filters = filtersFromUrlStr("works", alias);
    expect(filters[0].type).not.toBe("unknown");
    expect(facetTypeToChipType(getFacetConfig("works", filters[0].key))).not.toBeNull();
    expect(basicCanRepresent("works", filters)).toBe(true);
    expect(roundTrip("works", alias)).toBe(canonical);
  });

  it("folds non-chip aliases too (pmid is a typed-value field, no chip)", () => {
    expect(roundTrip("works", "pmid:12345")).toBe("ids.pmid:12345");
  });

  it("route and echo spellings hydrate the same query", () => {
    expect(roundTrip("works", "openalex:W2741809807,author.id:A5041041439"))
      .toBe(roundTrip("works", "ids.openalex:W2741809807,authorships.author.id:A5041041439"));
  });

  it("an alias and its canonical key are one field to the Basic gate (AND is not OR)", () => {
    const filters = filtersFromUrlStr("works", "author.id:A1,authorships.author.id:A2");
    expect(basicCanRepresent("works", filters)).toBe(false);
  });

  it("institutions.id is the exact-institution facet, not lineage", () => {
    const [f] = filtersFromUrlStr("works", "institutions.id:I33213144");
    expect(f.key).toBe("authorships.institutions.id");
    expect(f.displayName).toBe("exact institution");
  });

  it("leaves search keys as typed (the search box owns their spelling)", () => {
    expect(canonicalFilterKey("works", "default.search")).toBe("default.search");
    expect(roundTrip("works", "default.search:vaping OR vape")).toBe("default.search:vaping OR vape");
  });

  it("keeps the alias-keyed column configs reachable by their own key", () => {
    expect(getFacetConfig("works", "cites").key).toBe("cites");
    expect(getFacetConfig("works", "is_oa").key).toBe("is_oa");
  });

  it("folds per entity: sources' own is_oa is not a works alias", () => {
    expect(canonicalFilterKey("sources", "is_oa")).toBe("is_oa");
    expect(roundTrip("sources", "is_oa:true")).toBe("is_oa:true");
  });

  it("folds the two former hardcoded aliases via the server map", () => {
    expect(getFacetConfig("works", "primary_location.source.publisher_lineage").key)
      .toBe("primary_location.source.host_organization_lineage");
    expect(getFacetConfig("works", "institutions.is_global_south").key)
      .toBe("authorships.institutions.is_global_south");
    expect(getFacetConfig("authors", "last_known_institutions.is_global_south")?.key)
      .not.toBe("authorships.institutions.is_global_south");
  });
});
