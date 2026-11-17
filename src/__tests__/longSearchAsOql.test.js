/**
 * oxjob #941 (ZD 3489): a search too long for a URL runs as OQL.
 *
 * The flat `?search.*=` SERP fetches with a GET, and the API refuses a request line over
 * 8,190 bytes ("Request URL too long"). setNewSearch now sends a search that long through
 * the OQL route (POST, no cap) from any route, not only from an `?oql=` one (#1245).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { route, push, storeState, store } = vi.hoisted(() => {
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" } };
    const route = { value: { name: "Serp", query: {}, params: { entityType: "works" } } };
    const push = vi.fn(() => Promise.resolve());
    const storeState = { entityType: "works", isLoading: false, resultsObject: null };
    const store = { state: storeState, getters: { featureFlags: { oql: true } }, dispatch: vi.fn() };
    return { route, push, storeState, store };
});

vi.mock("@/router", () => ({ default: { currentRoute: route, push } }));
vi.mock("@/store", () => ({ default: store }));

import { url } from "@/url";

// About 9,000 characters of Boolean search, like the one in ZD 3489 tripled.
const term = (i) => `"drug overdose ${i}" OR "respiratory depression ${i}" OR "brain injury ${i}"`;
const LONG = "(" + Array.from({ length: 120 }, (_, i) => term(i)).join(" OR ") + ")";
const SHORT = '"drug overdose" AND "brain injury"';
const TYPE = "search.title_abstract_keywords";

beforeEach(() => {
    push.mockClear();
    store.dispatch.mockReset();
    store.getters.featureFlags = { oql: true };
    route.value = { name: "Serp", query: {}, params: { entityType: "works" } };
    storeState.isLoading = false;
    storeState.resultsObject = null;
});

describe("searchTooLongForUrl", () => {
    it("is false for an ordinary search and true past the URL budget", () => {
        expect(url.searchTooLongForUrl(SHORT, "")).toBe(false);
        expect(url.searchTooLongForUrl(LONG, "")).toBe(true);
        expect(LONG.length).toBeGreaterThan(8000);
    });
    it("counts the filter too, and empty input is never too long", () => {
        expect(url.searchTooLongForUrl("x", "a".repeat(7100))).toBe(true);
        expect(url.searchTooLongForUrl(undefined, undefined)).toBe(false);
    });
});

describe("setNewSearch: long searches run as OQL from the flat SERP", () => {
    it("keeps a short search on the flat ?search.*= route (no translate)", async () => {
        await url.setNewSearch("works", TYPE, SHORT);
        expect(store.dispatch).not.toHaveBeenCalled();
        expect(push).toHaveBeenCalledTimes(1);
        const pushed = push.mock.calls[0][0];
        expect(pushed.name).toBe("Serp");
        expect(pushed.query[TYPE]).toBe(SHORT);
    });

    it("translates a long search to OQL and pushes the /q?oql= route", async () => {
        store.dispatch.mockResolvedValue("get works about (stemmed \"drug overdose 0\" OR ...)");
        await url.setNewSearch("works", TYPE, LONG);
        expect(store.dispatch).toHaveBeenCalledWith("translateFiltersToOql", {
            entityType: "works",
            filter: undefined,
            query: { [TYPE]: LONG, sort: "relevance_score:desc" },
        });
        expect(push).toHaveBeenCalledTimes(1);
        const pushed = push.mock.calls[0][0];
        expect(pushed.name).toBe("OqlQuery");
        expect(pushed.query.oql).toMatch(/^get works about/);
        expect(pushed.query[TYPE]).toBeUndefined();
    });

    it("carries the current chips into the translate", async () => {
        route.value = { name: "Serp", query: { filter: "publication_year:2023" }, params: { entityType: "works" } };
        store.dispatch.mockResolvedValue("get works ...");
        await url.setNewSearch("works", TYPE, LONG);
        expect(store.dispatch.mock.calls[0][1].filter).toBe("publication_year:2023");
        expect(push.mock.calls[0][0].name).toBe("OqlQuery");
    });

    it("falls back to the flat route when the translate fails", async () => {
        store.dispatch.mockResolvedValue(null);
        await url.setNewSearch("works", TYPE, LONG);
        expect(push.mock.calls[0][0].name).toBe("Serp");
    });

    it("leaves the legacy interface (oql flag off) on the flat route", async () => {
        store.getters.featureFlags = { oql: false };
        await url.setNewSearch("works", TYPE, LONG);
        expect(store.dispatch).not.toHaveBeenCalled();
        expect(push.mock.calls[0][0].name).toBe("Serp");
    });
});
