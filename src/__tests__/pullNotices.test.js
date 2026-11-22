// oxjob #2264 — pull notices: works facets for pull_notice_works.id and pull_notice_works.link_type
// (labels equal the API registry's), and the work page's banner lines, one per notice.
import { describe, it, expect, vi } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { getFacetConfig } from "@/facetConfigUtils";

const NOTICE = {
  id: "https://openalex.org/W4245876183",
  display_name: "Retraction—Ileal-lymphoid-nodular hyperplasia",
  link_type: "retraction",
};

describe("pull notice facets", () => {
  it("pull_notice_works.id selects works, like parent_works.id", () => {
    const fc = getFacetConfig("works", "pull_notice_works.id");
    expect(fc.displayName).toBe("pull notice");
    expect(fc.entityToSelect).toBe("works");
    expect(fc.type).toBe("selectEntity");
    expect(fc.category).toBe("other");
    expect(fc.actions).toEqual(["filter", "group_by"]);
    expect(fc.extractFn({ pull_notice_works: [NOTICE] })).toEqual([NOTICE]);
  });

  it("pull_notice_works.link_type selects a link type, like parent_works.link_type", () => {
    const fc = getFacetConfig("works", "pull_notice_works.link_type");
    const parent = getFacetConfig("works", "parent_works.link_type");
    expect(fc.displayName).toBe("pull notice link type");
    for (const key of ["entityToSelect", "type", "category", "actions"]) {
      expect(fc[key], key).toEqual(parent[key]);
    }
    expect(fc.extractFn({ pull_notice_works: [NOTICE] })).toEqual(["retraction"]);
    expect(fc.extractFn({})).toEqual([]);
  });
});

// The header pulls in the store, router, API and the page's action components; the banner needs none of them.
vi.mock("vuex", () => ({ useStore: () => ({ state: {} }) }));
vi.mock("vue-router", () => ({ useRouter: () => ({}) }));
vi.mock("@/api", () => ({ api: {} }));
vi.mock("@/filterConfigs", () => ({ createSimpleFilter: () => null, filtersAsUrlStr: () => "" }));
vi.mock("@/filters", () => ({
  default: {
    capitalize: (s) => s.charAt(0).toUpperCase() + s.slice(1),
    prettyTitle: (s) => s,
    entityZoomLink: (id) => `/${id.replace("https://openalex.org/", "")}`,
  },
}));
vi.mock("@/components/LinkEntityRolesList.vue", () => ({ default: { render: () => null } }));
vi.mock("@/components/WorkLinkouts.vue", () => ({ default: { render: () => null } }));
vi.mock("@/components/LocationLinkouts.vue", () => ({ default: { render: () => null } }));
vi.mock("@/components/Entity/EntityHeaderClaimProfileButton.vue", () => ({ default: { render: () => null } }));
vi.mock("@/components/Collection/EntityCollectionsRow.vue", () => ({ default: { render: () => null } }));
vi.mock("@/components/Entity/EntityCollectionButton.vue", () => ({ default: { render: () => null } }));
vi.mock("@/components/Entity/EntityMoreMenu.vue", () => ({ default: { render: () => null } }));
vi.mock("@/components/SerpResultsExportButton.vue", () => ({ default: { render: () => null } }));
const { default: EntityHeader } = await import("@/components/Entity/EntityHeader.vue");

const renderBanner = async (entityData) => {
  const app = createSSRApp({ render: () => h(EntityHeader, { entityData, entityType: "works" }) });
  app.component("v-alert", { render() { return h("section", this.$slots.default?.()); } });
  app.component("router-link", {
    props: ["to"],
    render() { return h("a", { href: this.to }, this.$slots.default?.()); },
  });
  app.config.warnHandler = () => {};
  let err = null;
  app.config.errorHandler = (e) => { err = e; };
  const html = await renderToString(app);
  if (err) throw err;
  const match = html.match(/<section[^>]*>([\s\S]*?)<\/section>/);
  return match ? match[1] : null;
};
const text = (html) => html.replace(/<!--.*?-->/gs, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

describe("work page banner", () => {
  const WITHDRAWAL = { id: "https://openalex.org/W2", display_name: "Withdrawn: a duplicate", link_type: "withdrawal" };

  it("lists each notice, labeled by its link type and linked to the notice, retracted or not", async () => {
    const banner = await renderBanner({ id: "https://openalex.org/W1", display_name: "A paper", is_retracted: false,
      is_pulled: true, pull_notice_works: [NOTICE, WITHDRAWAL] });
    expect(banner).not.toBeNull();
    expect(text(banner)).toBe(`Retraction notice: ${NOTICE.display_name} Withdrawal notice: ${WITHDRAWAL.display_name}`);
    expect(banner).toMatch(/<a href="\/W4245876183"[^>]*>Retraction—Ileal/);
    expect(banner).toMatch(/<a href="\/W2"[^>]*>Withdrawn: a duplicate/);
  });

  it("keeps the retracted line above the notices", async () => {
    const banner = await renderBanner({ id: "https://openalex.org/W1", display_name: "A paper", is_retracted: true,
      pull_notice_works: [NOTICE] });
    expect(text(banner)).toBe(`This work has been retracted. Retraction notice: ${NOTICE.display_name}`);
  });

  it("no banner for a work with no notices that isn't retracted", async () => {
    expect(await renderBanner({ id: "https://openalex.org/W1", display_name: "A paper", pull_notice_works: [] })).toBeNull();
    expect(await renderBanner({ id: "https://openalex.org/W1", display_name: "A paper" })).toBeNull();
  });
});
