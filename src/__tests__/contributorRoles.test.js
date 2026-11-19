// oxjob #2075 — the CRediT contributor-roles vocabulary: works facet (read from
// every authorship), entity config, ids, record pages.
import { describe, it, expect } from "vitest";
import { getFacetConfig } from "@/facetConfigUtils";
import { getEntityConfig } from "@/entityConfigs";
import * as openalexId from "@/openalexId";
import { parseRecordPath, worksListPlan } from "@/ssr/recordRoutes";
import { entityLinkItems } from "@/components/Entity/entityDatumValues";

const SOFTWARE = { id: "https://openalex.org/contributor-roles/software", display_name: "Software" };
const DRAFT = {
  id: "https://openalex.org/contributor-roles/writing-original-draft",
  display_name: "Writing – original draft",
};

describe("contributor roles", () => {
  it("works facet filters authorships.contributor_roles.id from the contributor-roles entity", () => {
    const fc = getFacetConfig("works", "authorships.contributor_roles.id");
    expect(fc.entityToSelect).toBe("contributor-roles");
    // label-consistency gate: must equal the registry display_name
    expect(fc.displayName).toBe("contributor role");
    // the API registry's "author" category, beside authors_count and corresponding authors
    expect(fc.category).toBe("author");
    expect(fc.actions).toEqual(expect.arrayContaining(["filter", "group_by"]));
  });

  it("the facet reads every authorship's roles, once each", () => {
    const fc = getFacetConfig("works", "authorships.contributor_roles.id");
    const work = {
      authorships: [
        { contributor_roles: [SOFTWARE, DRAFT] },
        { contributor_roles: [] },
        { contributor_roles: [{ ...SOFTWARE }] },
        {},
      ],
    };
    expect(fc.extractFn(work)).toEqual([SOFTWARE, DRAFT]);
    expect(entityLinkItems(fc.extractFn(work))).toEqual([SOFTWARE, DRAFT]);
    expect(fc.extractFn({ authorships: [] })).toEqual([]);
    expect(fc.extractFn({})).toEqual([]);
  });

  it("shows on the work page, after the authors", () => {
    const rows = getEntityConfig("works").rowsToShowOnEntityPage;
    expect(rows.indexOf("authorships.contributor_roles.id")).toBe(rows.indexOf("authorships.author.id") + 1);
  });

  it("entity config filters works by authorships.contributor_roles.id", () => {
    const ec = getEntityConfig("contributor-roles");
    expect(ec.filterKey).toBe("authorships.contributor_roles.id");
    expect(ec.isNative).toBe(false);
    // /autocomplete/contributor-roles would 404: the 14 values load from /contributor-roles
    expect(ec.hasAutocomplete).toBe(false);
    expect(ec.displayName).toBe("contributor roles");
    expect(ec.rowsToShowOnEntityPage).toEqual(["description"]);
    expect(getEntityConfig("contributor role")).toBe(ec);
  });

  it("full and short ids normalize to the namespaced form", () => {
    for (const id of [
      "https://openalex.org/contributor-roles/writing-original-draft",
      "contributor-roles/writing-original-draft",
    ]) {
      expect(openalexId.normalizeId(id)).toBe("contributor-roles/writing-original-draft");
      expect(openalexId.getEntityType(id)).toBe("contributor-roles");
      expect(openalexId.getShortId(id)).toBe("writing-original-draft");
    }
  });

  it("record pages render server-side and list the role's works", () => {
    const parsed = parseRecordPath("/contributor-roles/software");
    expect(parsed.apiPath).toBe("contributor-roles/software");
    expect(worksListPlan("contributor-roles").filterKey).toBe("authorships.contributor_roles.id");
  });

  it("gets the standard injected count facets and its own description and name", () => {
    expect(getFacetConfig("contributor-roles", "works_count")).toBeTruthy();
    expect(getFacetConfig("contributor-roles", "cited_by_count")).toBeTruthy();
    expect(getFacetConfig("contributor-roles", "description")).toBeTruthy();
    expect(getFacetConfig("contributor-roles", "display_name").isIdentityColumn).toBe(true);
  });
});
