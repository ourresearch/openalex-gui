/**
 * oxjob #862 — semantic search caps results at 50 and the API 400s a larger
 * per_page ("per_page cannot exceed 50 for semantic search"). The legacy URL →
 * GET path (what the SERP runs for /works?search.semantic=…&filter=… deep links
 * and chip edits) must clamp the page size it sends; the displayed preference
 * is untouched.
 */
import { describe, it, expect, vi } from "vitest";

const { route, storeState } = vi.hoisted(() => {
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" } };
    const route = { value: { query: {}, params: { entityType: "works" } } };
    const storeState = { serpGroupBy: {}, serpPageSize: 100, serpTablePageSize: 100 };
    return { route, storeState };
});
vi.mock("@/router", () => ({ default: { currentRoute: route, push: () => Promise.resolve() } }));
vi.mock("@/store", () => ({ default: { state: storeState, getters: {} } }));

import { url } from "@/url";
import { SEMANTIC_MAX_PER_PAGE } from "@/semanticLimits";

const ROUTE = (query) => ({ query, params: { entityType: "works" } });
const perPageOf = (apiUrl) => new URL(apiUrl).searchParams.get("per_page");

describe("makeApiUrl clamps per_page for semantic search (#862)", () => {
    it("sends per_page=50 when the route has search.semantic and the page size is 100", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ "search.semantic": "protein folding", filter: "publication_year:2020-" }));
        expect(perPageOf(apiUrl)).toBe(String(SEMANTIC_MAX_PER_PAGE));
        expect(new URL(apiUrl).searchParams.get("search.semantic")).toBe("protein folding");
    });

    it("leaves non-semantic requests at the user's page size", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ filter: "publication_year:2020-" }));
        expect(perPageOf(apiUrl)).toBe("100");
    });
});

describe("makeApiUrl sends no sort with a semantic search (oxjob #2003)", () => {
    it("drops the route's sort: semantic search has one order and the API 400s any other", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ "search.semantic": "protein folding", sort: "publication_year:desc" }));
        expect(new URL(apiUrl).searchParams.get("sort")).toBeNull();
    });

    it("keeps the sort on other searches", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ search: "protein folding", sort: "publication_year:desc" }));
        expect(new URL(apiUrl).searchParams.get("sort")).toBe("publication_year:desc");
    });
});
