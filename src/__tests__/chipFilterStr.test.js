/**
 * #378 C1+C2: url.chipFilterStr is the single source for basic-chip display and
 * edit-base. It returns the settled response's canonical meta.x_query.url filter
 * once it has landed (server is source of truth for query meaning), and falls
 * back to route.query.filter while a request is in flight. Search-typed clauses
 * (the server folds ?search= into default.search:…) are stripped so they never
 * leak into the chip filter / get re-serialized back into ?filter=.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { storeState, route } = vi.hoisted(() => {
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" } };
    const route = { value: { query: { filter: "" }, params: { entityType: "works" } } };
    return { storeState: {}, route };
});

vi.mock("@/router", () => ({
    default: {
        currentRoute: route,
        push: () => Promise.resolve(),
    },
}));
vi.mock("@/store", () => ({ default: { state: storeState } }));

import { url } from "@/url";

const ROUTE = (filter, entityType = "works") => ({ query: { filter }, params: { entityType } });
const xqUrl = (path) => `https://api.openalex.org${path}`;

describe("url.chipFilterStr (#378)", () => {
    beforeEach(() => {
        storeState.isLoading = false;
        storeState.resultsObject = null;
    });

    it("falls back to the route filter when no response has landed", () => {
        expect(url.chipFilterStr(ROUTE("type:article"))).toBe("type:article");
    });

    it("returns the canonical x_query.url filter once settled (entity matches)", () => {
        storeState.resultsObject = { meta: { x_query: { url: xqUrl("/works?filter=publication_year:2020-2024,type:article") } } };
        expect(url.chipFilterStr(ROUTE("type:article,publication_year:2020-2024"))).toBe("publication_year:2020-2024,type:article");
    });

    it("falls back to the route filter while a request is in flight (optimistic edits)", () => {
        storeState.isLoading = true;
        storeState.resultsObject = { meta: { x_query: { url: xqUrl("/works?filter=type:article") } } };
        expect(url.chipFilterStr(ROUTE("type:article,type:book"))).toBe("type:article,type:book");
    });

    it("falls back to the route filter on an entity mismatch (mid cross-entity nav)", () => {
        storeState.resultsObject = { meta: { x_query: { url: xqUrl("/authors?filter=display_name.search:smith") } } };
        expect(url.chipFilterStr(ROUTE("type:article", "works"))).toBe("type:article");
    });

    it("falls back to the route filter when x_query.url is null (complex query)", () => {
        storeState.resultsObject = { meta: { x_query: { url: null, oqo: {}, oql: "..." } } };
        expect(url.chipFilterStr(ROUTE("type:article"))).toBe("type:article");
    });

    it("strips a folded default.search clause so search never becomes a chip", () => {
        storeState.resultsObject = { meta: { x_query: { url: xqUrl("/works?filter=default.search:cancer,type:article") } } };
        expect(url.chipFilterStr(ROUTE("type:article"))).toBe("type:article");
    });

    it("strips scoped *.search clauses too (e.g. title.search)", () => {
        storeState.resultsObject = { meta: { x_query: { url: xqUrl("/works?filter=title.search:cancer,is_oa:true") } } };
        expect(url.chipFilterStr(ROUTE("is_oa:true"))).toBe("is_oa:true");
    });

    it("returns undefined when the canonical query is search-only (no chips)", () => {
        storeState.resultsObject = { meta: { x_query: { url: xqUrl("/works?filter=default.search:cancer") } } };
        expect(url.chipFilterStr(ROUTE(undefined))).toBeUndefined();
    });

    it("does not strip non-search clauses that merely contain 'search' elsewhere", () => {
        storeState.resultsObject = { meta: { x_query: { url: xqUrl("/works?filter=type:article") } } };
        expect(url.chipFilterStr(ROUTE("type:article"))).toBe("type:article");
    });
});
