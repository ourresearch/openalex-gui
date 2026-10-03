/**
 * oxjob #1521 — the SERP asks the API to rerank (Jev reorders the top 100) on a
 * relevance-sorted works search, only for pages that start inside those 100.
 */
import { describe, it, expect, vi } from "vitest";

const { route, storeState } = vi.hoisted(() => {
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" } };
    const route = { value: { query: {}, params: { entityType: "works" } } };
    const storeState = { serpGroupBy: {}, serpPageSize: 25, serpTablePageSize: 25 };
    return { route, storeState };
});
vi.mock("@/router", () => ({ default: { currentRoute: route, push: () => Promise.resolve() } }));
vi.mock("@/store", () => ({ default: { state: storeState, getters: {} } }));

import { url } from "@/url";

const ROUTE = (query, entityType = "works") => ({ query, params: { entityType } });
const rerankOf = (apiUrl) => new URL(apiUrl).searchParams.get("rerank");

describe("makeApiUrl sends rerank=true (#1521)", () => {
    it("on a title, abstract & keywords search, page 1", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ "search.title_abstract_keywords": "coral bleaching" }));
        expect(rerankOf(apiUrl)).toBe("true");
        expect(new URL(apiUrl).searchParams.get("search.title_abstract_keywords")).toBe("coral bleaching");
    });

    it("on page 4 at 25 per page (positions 76-100), not on page 5", () => {
        expect(rerankOf(url.makeApiUrl(ROUTE({ search: "coral", page: "4" })))).toBe("true");
        expect(rerankOf(url.makeApiUrl(ROUTE({ search: "coral", page: "5" })))).toBeNull();
    });

    it("not with a non-relevance sort, semantic search, no search, or another entity", () => {
        expect(rerankOf(url.makeApiUrl(ROUTE({ search: "coral", sort: "cited_by_count:desc" })))).toBeNull();
        expect(rerankOf(url.makeApiUrl(ROUTE({ "search.semantic": "coral reefs" })))).toBeNull();
        expect(rerankOf(url.makeApiUrl(ROUTE({ filter: "publication_year:2020" })))).toBeNull();
        expect(rerankOf(url.makeApiUrl(ROUTE({ search: "smith" }, "authors")))).toBeNull();
    });

    it("not on group-by or CSV requests", () => {
        expect(rerankOf(url.makeApiUrl(ROUTE({ search: "coral" }), false, "type"))).toBeNull();
        expect(rerankOf(url.makeApiUrl(ROUTE({ search: "coral" }), true))).toBeNull();
    });
});
