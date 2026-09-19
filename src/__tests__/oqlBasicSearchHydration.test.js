/**
 * oxjob #1245 (Inist item 2.7): Basic mode under the entity-less `/q?oql=` route.
 *
 * The URL carries no `search.*=` param there — the server folds the search into
 * x_query.url as a `<scope>.search:…` filter clause, which chipFilterStr strips.
 * These pin the three helpers that now read the search back out of the settled
 * canonical response:
 *   - searchFromCanonicalXQuery / getSearchFromRoute → the box hydrates
 *   - nonFilterClausesFromCanonical → a chip edit re-translates WITH the search
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { storeState, route } = vi.hoisted(() => {
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" } };
    const route = { value: { name: "OqlQuery", query: { oql: "works where …" }, params: {} } };
    return { storeState: { entityType: "works" }, route };
});

vi.mock("@/router", () => ({
    default: { currentRoute: route, push: () => Promise.resolve() },
}));
vi.mock("@/store", () => ({ default: { state: storeState } }));

import { url } from "@/url";

const xq = (path) => ({ meta: { x_query: { url: `https://api.openalex.org${path}` } } });
const OQL_ROUTE = route.value;

describe("searchFromCanonicalXQuery (#1245)", () => {
    beforeEach(() => {
        storeState.isLoading = false;
        storeState.entityType = "works";
        storeState.resultsObject = null;
    });

    it("lifts a folded title_and_abstract.search clause out of the canonical filter", () => {
        storeState.resultsObject = xq("/works?filter=authorships.institutions.lineage:i136199984,title_and_abstract.search:rose bengal,open_access.is_oa:false");
        expect(url.searchFromCanonicalXQuery(OQL_ROUTE))
            .toEqual({ type: "search.title_and_abstract", value: "rose bengal" });
        expect(url.getSearchFromRoute(OQL_ROUTE))
            .toEqual({ type: "search.title_and_abstract", value: "rose bengal" });
    });

    it("maps fulltext/default/title scopes and .exact variants like the #397 redirect", () => {
        storeState.resultsObject = xq("/works?filter=fulltext.search:foo");
        expect(url.searchFromCanonicalXQuery(OQL_ROUTE)).toEqual({ type: "search", value: "foo" });
        storeState.resultsObject = xq("/works?filter=title.search.exact:bar,type:article");
        expect(url.searchFromCanonicalXQuery(OQL_ROUTE)).toEqual({ type: "search.title.exact", value: "bar" });
    });

    it("prefers a top-level search param when the canonical url carries one", () => {
        storeState.resultsObject = xq("/works?search.title=zip&filter=type:article");
        expect(url.searchFromCanonicalXQuery(OQL_ROUTE)).toEqual({ type: "search.title", value: "zip" });
    });

    it("ignores a NEGATED search clause (no positive box to hydrate)", () => {
        storeState.resultsObject = xq("/works?filter=!title_and_abstract.search:foo,type:article");
        expect(url.searchFromCanonicalXQuery(OQL_ROUTE)).toBeNull();
    });

    it("returns null with no search, while loading, or from another entity's response", () => {
        storeState.resultsObject = xq("/works?filter=type:article");
        expect(url.searchFromCanonicalXQuery(OQL_ROUTE)).toBeNull();
        storeState.resultsObject = xq("/works?filter=title.search:foo");
        storeState.isLoading = true;
        expect(url.searchFromCanonicalXQuery(OQL_ROUTE)).toBeNull();
        storeState.isLoading = false;
        storeState.resultsObject = xq("/authors?filter=display_name.search:foo");
        expect(url.searchFromCanonicalXQuery(OQL_ROUTE)).toBeNull();
    });

    it("getSearchFromRoute only consults the canonical query on an ?oql= route", () => {
        storeState.resultsObject = xq("/works?filter=title.search:foo");
        expect(url.getSearchFromRoute({ query: { filter: "type:article" } })).toBeNull();
        expect(url.getSearchFromRoute({ query: { search: "typed" , oql: "x" } }))
            .toEqual({ type: "search", value: "typed" });
    });
});

describe("nonFilterClausesFromCanonical keeps the folded search (#1245)", () => {
    beforeEach(() => {
        storeState.isLoading = false;
        storeState.entityType = "works";
    });

    it("re-emits the search as the top-level param the translate understands, minus filter/paging", () => {
        storeState.resultsObject = xq("/works?filter=title_and_abstract.search:rose bengal,open_access.is_oa:false&sort=cited_by_count:desc&page=2&per_page=50");
        expect(url.nonFilterClausesFromCanonical()).toEqual({
            sort: "cited_by_count:desc",
            "search.title_and_abstract": "rose bengal",
        });
    });

    it("is empty when the canonical query has no search", () => {
        storeState.resultsObject = xq("/works?filter=open_access.is_oa:false");
        expect(url.nonFilterClausesFromCanonical()).toEqual({});
    });
});
