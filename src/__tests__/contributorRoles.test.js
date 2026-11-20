// oxjob #2075 — the CRediT contributor-roles vocabulary: each author's roles show
// with that author on the work page; the contributor-roles entity pages show a
// role and its counts. There is no works filter on a role alone (the API reads
// roles per authorship), so no works facet, works list or works link.
import { describe, it, expect, vi } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { getFacetConfig } from "@/facetConfigUtils";
import { getEntityConfig } from "@/entityConfigs";
import * as openalexId from "@/openalexId";
import { parseRecordPath, worksListPlan, RECORD_TYPES } from "@/ssr/recordRoutes";
import { contributorRoleItems } from "@/components/Entity/entityDatumValues";

// The real filters and url modules pull in the router and store; the row needs
// only these few.
vi.mock("@/filters", () => ({
  default: {
    capitalize: (s) => s.charAt(0).toUpperCase() + s.slice(1),
    pluralize: (s, n) => (n === 1 ? s : `${s}s`),
    toPrecision: (n) => String(n),
    entityZoomLink: (id) => `/${id.replace("https://openalex.org/", "")}`,
  },
}));
vi.mock("@/url", () => ({ url: {} }));
const { default: EntityDatumRow } = await import("@/components/Entity/EntityDatumRow.vue");

const SOFTWARE = { id: "https://openalex.org/contributor-roles/software", display_name: "Software" };
const DRAFT = {
  id: "https://openalex.org/contributor-roles/writing-original-draft",
  display_name: "Writing – original draft",
};

const WORK = {
  id: "https://openalex.org/W1",
  authorships: [
    {
      author: { id: "https://openalex.org/A1", display_name: "Jialin Zhou" },
      raw_author_name: "Jialin Zhou",
      contributor_roles: [SOFTWARE, DRAFT],
    },
    {
      author: { id: "https://openalex.org/A2", display_name: "Wei Li" },
      raw_author_name: "Wei Li",
      contributor_roles: [],
    },
    { raw_author_name: "WHO Consultation", contributor_roles: [SOFTWARE] },
  ],
};

const renderAuthorsRow = async (data) => {
  const app = createSSRApp({ render: () => h(EntityDatumRow, { filterKey: "authorships.author.id", type: "works", data }) });
  app.component("router-link", {
    props: ["to"],
    render() { return h("a", { href: this.to }, this.$slots.default?.()); },
  });
  app.config.warnHandler = () => {};
  let err = null;
  app.config.errorHandler = (e) => { err = e; };
  const html = await renderToString(app);
  if (err) throw err;
  return html;
};
const text = (html) => html.replace(/<!--.*?-->/gs, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

describe("contributor roles on the work page", () => {
  it("no works facet and no work-wide roles row", () => {
    expect(getFacetConfig("works", "authorships.contributor_roles.id")).toBeFalsy();
    expect(getEntityConfig("works").rowsToShowOnEntityPage).not.toContain("authorships.contributor_roles.id");
  });

  it("each author item carries its own authorship's roles", () => {
    const authors = getFacetConfig("works", "authorships.author.id").extractFn(WORK);
    expect(authors.map((a) => a.contributor_roles)).toEqual([[SOFTWARE, DRAFT], [], [SOFTWARE]]);
    // a work from before the field existed
    const old = getFacetConfig("works", "authorships.author.id").extractFn({
      authorships: [{ author: { id: "https://openalex.org/A1" }, raw_author_name: "X" }],
    });
    expect(old[0].contributor_roles).toEqual([]);
  });

  it("contributorRoleItems: the named roles, [] when none", () => {
    expect(contributorRoleItems({ contributor_roles: [SOFTWARE, null, { id: "x" }, DRAFT] })).toEqual([SOFTWARE, DRAFT]);
    expect(contributorRoleItems({ contributor_roles: [] })).toEqual([]);
    expect(contributorRoleItems({})).toEqual([]);
    expect(contributorRoleItems(null)).toEqual([]);
  });

  it("renders each author's roles after the name, linked to the role pages", async () => {
    const html = await renderAuthorsRow(WORK);
    expect(text(html)).toBe(
      "Authors: Jialin Zhou(Software, Writing – original draft), Wei Li, WHO Consultation(Software)"
    );
    expect(html).toMatch(/<a href="\/contributor-roles\/software" class="contributor-role"[^>]*>Software<\/a>/);
    expect(html).toMatch(/<a href="\/contributor-roles\/writing-original-draft" class="contributor-role"/);
    // the roles sit in their own muted span; an author with none gets no span
    expect(html.match(/class="contributor-roles/g)).toHaveLength(2);
  });

  it("a work with no roles renders the authors exactly as before", async () => {
    const plain = { ...WORK, authorships: WORK.authorships.map((a) => ({ ...a, contributor_roles: [] })) };
    const html = await renderAuthorsRow(plain);
    expect(text(html)).toBe("Authors: Jialin Zhou, Wei Li, WHO Consultation");
    expect(html).not.toContain("contributor-roles");
  });
});

describe("contributor-roles entity", () => {
  it("has no works filter, so its page has no works list", () => {
    const ec = getEntityConfig("contributor-roles");
    expect(ec.filterKey).toBeNull();
    expect(RECORD_TYPES["contributor-roles"].filterKey).toBeNull();
    expect(worksListPlan("contributor-roles", null)).toBeNull();
    // /autocomplete/contributor-roles would 404
    expect(ec.hasAutocomplete).toBe(false);
    expect(ec.isNative).toBe(false);
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

  it("record pages render server-side", () => {
    expect(parseRecordPath("/contributor-roles/software").apiPath).toBe("contributor-roles/software");
  });

  it("shows its name, definition and counts", () => {
    expect(getEntityConfig("contributor-roles").metricsToShowOnEntityPage).toEqual(["works_count", "cited_by_count"]);
    expect(getFacetConfig("contributor-roles", "works_count")).toBeTruthy();
    expect(getFacetConfig("contributor-roles", "cited_by_count")).toBeTruthy();
    expect(getFacetConfig("contributor-roles", "description")).toBeTruthy();
    expect(getFacetConfig("contributor-roles", "display_name").isIdentityColumn).toBe(true);
  });
});
