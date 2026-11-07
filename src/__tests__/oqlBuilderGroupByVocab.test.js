import { describe, it, expect, vi, beforeEach } from "vitest";

// Builder value picking for closed-vocab keyword columns with no entity endpoint
// (awards provenance / funding_type, locations provenance / version, …). These used to
// fall through to a free-text box in the Advanced builder: no list to pick from, and
// no NOT in the chip menu (only reachable by typing a literal `not ` prefix).

const getGroups = vi.fn();
vi.mock("@/api", () => ({ api: { getGroups: (...a) => getGroups(...a) } }));
// apiConfig pulls in the store → router → Nuxt views; oqlEditorApi only needs its shape.
vi.mock("@/apiConfig", () => ({ urlBase: { api: "https://api.openalex.org" }, axiosConfig: () => ({}) }));

import { tagGroupByVocab, isGroupByVocabFacet, groupByVocabRows } from "@/components/OqlPlayground/groupByVocab";
import {
  valueKindForProperty, isListVocabEntity, autocompleteEntityFor,
} from "@/components/OqlPlayground/oqoTree";
import { getGroupByValues, GROUP_BY_VOCAB_PAGE } from "@/components/OqlPlayground/oqlEditorApi";

// A trimmed awards /properties catalog (shapes as the server publishes them).
const awardsCatalog = () => ({
  provenance: { name: "provenance", type: "string", operators: ["eq", "null"] },
  funding_type: { name: "funding_type", type: "string", operators: ["eq", "null"] },
  funder_scheme: { name: "funder_scheme", type: "string", operators: ["eq", "null"] },
  "funder.id": { name: "funder.id", type: "openalex_id", entity_type: "funders", operators: ["eq"] },
  start_year: { name: "start_year", type: "number", operators: ["eq", "range"] },
  "lead_investigator.given_name": { name: "lead_investigator.given_name", type: "string", operators: ["eq"] },
});

describe("tagGroupByVocab", () => {
  it("tags the awards closed-vocab keyword columns, and only those", () => {
    const tagged = tagGroupByVocab("awards", awardsCatalog());
    expect(tagged.provenance._groupByVocab).toBe(true);
    expect(tagged.funding_type._groupByVocab).toBe(true);
    expect(tagged.funder_scheme._groupByVocab).toBe(true);
    expect(tagged["funder.id"]._groupByVocab).toBeUndefined();
    expect(tagged.start_year._groupByVocab).toBeUndefined();
    expect(tagged["lead_investigator.given_name"]._groupByVocab).toBeUndefined();
  });

  it("tags locations provenance / version too", () => {
    const tagged = tagGroupByVocab("locations", {
      provenance: { type: "string", operators: ["eq"] },
      version: { type: "string", operators: ["eq"] },
    });
    expect(tagged.provenance._groupByVocab).toBe(true);
    expect(tagged.version._groupByVocab).toBe(true);
  });

  it("does not mutate the server catalog", () => {
    const cat = awardsCatalog();
    tagGroupByVocab("awards", cat);
    expect(cat.provenance._groupByVocab).toBeUndefined();
  });

  it("never re-types a column the server already gives an entity_type", () => {
    const tagged = tagGroupByVocab("awards", {
      provenance: { type: "string", entity_type: "award-provenances", operators: ["eq"] },
    });
    expect(tagged.provenance._groupByVocab).toBeUndefined();
  });

  it("returns the catalog untouched for an entity with no facet configs", () => {
    const cat = { foo: { type: "string" } };
    expect(tagGroupByVocab("no-such-entity", cat)).toBe(cat);
  });

  it("requires a select facet that can both filter and group_by", () => {
    expect(isGroupByVocabFacet({ type: "selectEntity", actions: ["filter", "group_by"] })).toBe(true);
    expect(isGroupByVocabFacet({ type: "selectEntity", actions: ["column"] })).toBe(false);
    expect(isGroupByVocabFacet({ type: "selectEntity", entityToSelect: "funders", actions: ["filter", "group_by"] })).toBe(false);
    expect(isGroupByVocabFacet({ type: "search", actions: ["filter", "group_by"] })).toBe(false);
  });
});

describe("a tagged column is an entity-kind (picker) field", () => {
  const tagged = tagGroupByVocab("awards", awardsCatalog());

  it("value kind: entity, not free text", () => {
    expect(valueKindForProperty(awardsCatalog().provenance)).toBe("text"); // the bug
    expect(valueKindForProperty(tagged.provenance)).toBe("entity");
    expect(valueKindForProperty(tagged.funding_type)).toBe("entity");
  });

  it("is not routed to the /{entity} list or /autocomplete sources", () => {
    expect(isListVocabEntity(tagged.provenance)).toBe(false);
    expect(autocompleteEntityFor(tagged.provenance)).toBe(null);
  });
});

describe("groupByVocabRows", () => {
  const vocab = {
    values: [
      { value: "crossref_work_funders", display_name: "crossref_work_funders", count: 6753000 },
      { value: "nih", display_name: "nih", count: 2900000 },
      { value: "crossref_grants", display_name: "crossref_grants", count: 120000 },
    ],
    truncated: false,
  };

  it("lists every value, most common first, with counts, when nothing is typed", () => {
    const rows = groupByVocabRows(vocab, "", "awards");
    expect(rows.map((r) => r.value)).toEqual(["crossref_work_funders", "nih", "crossref_grants"]);
    expect(rows[0].hint).toBe("6,753,000 awards");
  });

  it("filters case-insensitively on the typed query", () => {
    expect(groupByVocabRows(vocab, "CROSSREF", "awards").map((r) => r.value))
      .toEqual(["crossref_work_funders", "crossref_grants"]);
  });

  it("offers no free-typed row for a complete vocabulary", () => {
    expect(groupByVocabRows(vocab, "zzz", "awards")).toEqual([]);
  });

  it("offers the typed text when the list may be incomplete", () => {
    const rows = groupByVocabRows({ ...vocab, truncated: true }, " Some Scheme ", "awards");
    expect(rows).toEqual([{ value: "Some Scheme", display_name: "Some Scheme", hint: "use this value" }]);
  });

  it("does not duplicate an exact match as a typed row", () => {
    const rows = groupByVocabRows({ ...vocab, truncated: true }, "nih", "awards");
    expect(rows.map((r) => r.value)).toEqual(["nih"]);
  });
});

describe("getGroupByValues", () => {
  beforeEach(() => getGroups.mockReset());

  it("loads the column's group_by buckets once and caches them", async () => {
    getGroups.mockResolvedValue([
      { value: "crossref_work_funders", displayValue: "crossref_work_funders", count: 10 },
      { value: "", displayValue: "", count: 1 },
    ]);
    const a = await getGroupByValues("awards", "provenance");
    const b = await getGroupByValues("awards", "provenance");
    expect(getGroups).toHaveBeenCalledTimes(1);
    expect(getGroups).toHaveBeenCalledWith("awards", "provenance",
      { hideUnknown: true, perPage: GROUP_BY_VOCAB_PAGE });
    expect(a).toBe(b);
    expect(a).toEqual({
      values: [{ value: "crossref_work_funders", display_name: "crossref_work_funders", count: 10 }],
      truncated: false,
    });
  });

  it("flags a full page as possibly truncated", async () => {
    getGroups.mockResolvedValue(Array.from({ length: GROUP_BY_VOCAB_PAGE }, (_, i) =>
      ({ value: `s${i}`, displayValue: `s${i}`, count: 1 })));
    const r = await getGroupByValues("awards", "funder_scheme");
    expect(r.truncated).toBe(true);
  });

  it("does not cache a failed load", async () => {
    getGroups.mockRejectedValueOnce(new Error("boom"));
    await expect(getGroupByValues("locations", "version")).rejects.toThrow("boom");
    getGroups.mockResolvedValueOnce([{ value: "publishedVersion", displayValue: "publishedVersion", count: 3 }]);
    const r = await getGroupByValues("locations", "version");
    expect(r.values.map((v) => v.value)).toEqual(["publishedVersion"]);
  });
});
