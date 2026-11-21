// oxjob #2437 — author type (human, organization, software-agent; null = not stated):
// the works and authors facets, the author-types entity, the works SERP's
// "Only AI authors" / "Exclude AI authors" switches, and the "AI" tag beside a
// software-agent author on the work page.
import { describe, it, expect, vi } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { getFacetConfig } from "@/facetConfigUtils";
import { getEntityConfig } from "@/entityConfigs";
import { filtersFromUrlStr, filtersAsUrlStr } from "@/filterConfigs";
import * as openalexId from "@/openalexId";
import { parseRecordPath, worksListPlan, RECORD_TYPES } from "@/ssr/recordRoutes";
import { basicCanRepresent, withoutSwitchFilters } from "@/components/Filter/basicFilterMode";
import {
  AI_AUTHORS_MODES,
  aiAuthorsMode,
  authorTypeTag,
  filtersWithAiAuthorsMode,
  nextAiAuthorsMode,
} from "@/authorType";

// The real filters and url modules pull in the router and store; the row needs only these few.
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

const works = (str) => filtersFromUrlStr("works", str);
const asUrl = (filters) => filtersAsUrlStr(filters);

describe("author type facets", () => {
  it("works facet authorships.author.type selects from the author-types entity", () => {
    const fc = getFacetConfig("works", "authorships.author.type");
    // label-consistency gate: must equal the registry display_name
    expect(fc.displayName).toBe("author type");
    expect(fc.entityToSelect).toBe("author-types");
    expect(fc.type).toBe("selectEntity");
    expect(fc.category).toBe("author");
    expect(fc.actions).toEqual(["filter", "group_by"]);
  });

  it("the works facet reads each stated type once, in byline order", () => {
    const fc = getFacetConfig("works", "authorships.author.type");
    const work = {
      authorships: [
        { author: { id: "https://openalex.org/A1", type: null } },
        { author: { id: "https://openalex.org/A2", type: "software-agent" } },
        { author: { id: "https://openalex.org/A3", type: "human" } },
        { author: { id: "https://openalex.org/A4", type: "software-agent" } },
        { raw_author_name: "Unlinked" },
      ],
    };
    expect(fc.extractFn(work)).toEqual(["software-agent", "human"]);
    expect(fc.extractFn({ authorships: [] })).toEqual([]);
    expect(fc.extractFn({})).toEqual([]);
  });

  it("authors facet type selects from the author-types entity", () => {
    const fc = getFacetConfig("authors", "type");
    expect(fc.displayName).toBe("author type");
    expect(fc.entityToSelect).toBe("author-types");
    expect(fc.category).toBe("other");
    expect(fc.extractFn({ type: "software-agent" })).toBe("software-agent");
    expect(fc.extractFn({ type: null })).toBeNull();
  });
});

describe("author-types entity", () => {
  it("filters works by authorships.author.type", () => {
    const ec = getEntityConfig("author-types");
    expect(ec.filterKey).toBe("authorships.author.type");
    expect(RECORD_TYPES["author-types"].filterKey).toBe("authorships.author.type");
    expect(worksListPlan("author-types").filterKey).toBe("authorships.author.type");
    // /autocomplete/author-types would 404: the three values load from /author-types
    expect(ec.hasAutocomplete).toBe(false);
    expect(ec.isNative).toBe(false);
    expect(ec.displayName).toBe("author types");
    expect(ec.rowsToShowOnEntityPage).toEqual(["description"]);
    expect(ec.metricsToShowOnEntityPage).toEqual(["works_count"]);
    expect(getEntityConfig("author type")).toBe(ec);
  });

  it("has works_count, a description and a name, and no cited_by_count", () => {
    expect(getFacetConfig("author-types", "works_count")).toBeTruthy();
    expect(getFacetConfig("author-types", "description")).toBeTruthy();
    expect(getFacetConfig("author-types", "display_name").isIdentityColumn).toBe(true);
    expect(getFacetConfig("author-types", "cited_by_count")).toBeFalsy();
  });

  it("ids normalize and record pages render server-side", () => {
    for (const id of ["https://openalex.org/author-types/software-agent", "author-types/software-agent"]) {
      expect(openalexId.normalizeId(id)).toBe("author-types/software-agent");
      expect(openalexId.getEntityType(id)).toBe("author-types");
      expect(openalexId.getShortId(id)).toBe("software-agent");
    }
    expect(parseRecordPath("/author-types/software-agent").apiPath).toBe("author-types/software-agent");
  });
});

describe("Only AI authors / Exclude AI authors switches", () => {
  it("are labelled as the website says, with no Human switch", () => {
    expect(Object.keys(AI_AUTHORS_MODES)).toEqual(["only", "exclude"]);
    expect(AI_AUTHORS_MODES.only.label).toBe("Only AI authors");
    expect(AI_AUTHORS_MODES.exclude.label).toBe("Exclude AI authors");
  });

  it("turning one on sets the filter; the other replaces it; clicking it again turns it off", () => {
    const base = works("publication_year:2025");
    const only = filtersWithAiAuthorsMode("works", base, nextAiAuthorsMode(null, "only"));
    expect(asUrl(only)).toBe("publication_year:2025,authorships.author.type:software-agent");
    expect(aiAuthorsMode(only)).toBe("only");

    const exclude = filtersWithAiAuthorsMode("works", only, nextAiAuthorsMode("only", "exclude"));
    expect(asUrl(exclude)).toBe("publication_year:2025,authorships.author.type:!software-agent");
    expect(aiAuthorsMode(exclude)).toBe("exclude");

    const off = filtersWithAiAuthorsMode("works", exclude, nextAiAuthorsMode("exclude", "exclude"));
    expect(asUrl(off)).toBe("publication_year:2025");
    expect(aiAuthorsMode(off)).toBeNull();
  });

  it("read the switch state from a URL, any id form", () => {
    expect(aiAuthorsMode(works("authorships.author.type:software-agent"))).toBe("only");
    expect(aiAuthorsMode(works("authorships.author.type:!software-agent"))).toBe("exclude");
    expect(aiAuthorsMode(works("authorships.author.type:author-types/software-agent"))).toBe("only");
    expect(aiAuthorsMode(works("type:article"))).toBeNull();
    // another type, or software-agent in an OR list, is a plain filter the switches leave alone
    expect(aiAuthorsMode(works("authorships.author.type:organization"))).toBeNull();
    expect(aiAuthorsMode(works("authorships.author.type:organization|software-agent"))).toBeNull();
    const kept = filtersWithAiAuthorsMode("works", works("authorships.author.type:organization"), "exclude");
    expect(asUrl(kept)).toBe("authorships.author.type:organization,authorships.author.type:!software-agent");
  });

  it("the switch's filter is no chip, so Exclude AI authors keeps the basic bar", () => {
    const filters = works("publication_year:2025,authorships.author.type:!software-agent");
    expect(withoutSwitchFilters(filters).map((f) => f.key)).toEqual(["publication_year"]);
    expect(basicCanRepresent("works", filters)).toBe(true);
    // a negated author type that the switches don't own still needs advanced
    expect(basicCanRepresent("works", works("authorships.author.type:!organization"))).toBe(false);
  });
});

const AGENT = { id: "https://openalex.org/A5", display_name: "Claude", type: "software-agent" };
const HUMAN = { id: "https://openalex.org/A6", display_name: "Wei Li", type: null };
const SOFTWARE = { id: "https://openalex.org/contributor-roles/software", display_name: "Software" };

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
const work = (...authors) => ({
  id: "https://openalex.org/W1",
  authorships: authors.map(([author, roles = []]) => ({ author, raw_author_name: author.display_name, contributor_roles: roles })),
});

describe("the AI tag beside a software-agent author", () => {
  it("authorTypeTag: only a software agent gets one", () => {
    expect(authorTypeTag({ type: "software-agent" })).toEqual({
      label: "AI", title: "Software agent", href: "/author-types/software-agent",
    });
    expect(authorTypeTag({ type: "https://openalex.org/author-types/software-agent" })?.label).toBe("AI");
    for (const type of ["human", "organization", null, undefined]) expect(authorTypeTag({ type })).toBeNull();
    expect(authorTypeTag(null)).toBeNull();
  });

  it("renders a small AI tag after the agent's name on the work page", async () => {
    const html = await renderAuthorsRow(work([AGENT], [HUMAN]));
    // the gap before the tag is the name's margin, as before the roles
    expect(text(html)).toBe("Authors: ClaudeAI, Wei Li");
    expect(html).toMatch(/<a href="\/author-types\/software-agent" class="author-type-tag" title="Software agent"[^>]*>AI<\/a>/);
    expect(html.match(/class="author-type-tag"/g)).toHaveLength(1);
  });

  it("sits between the name and the agent's roles", async () => {
    const html = await renderAuthorsRow(work([AGENT, [SOFTWARE]], [HUMAN]));
    expect(text(html)).toBe("Authors: ClaudeAI(Software), Wei Li");
  });

  it("a work with no agent author renders exactly as before", async () => {
    const html = await renderAuthorsRow(work([HUMAN], [{ ...AGENT, type: "human" }]));
    expect(text(html)).toBe("Authors: Wei Li, Claude");
    expect(html).not.toContain("author-type-tag");
  });
});
