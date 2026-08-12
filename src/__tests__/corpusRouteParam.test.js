/**
 * #763: first-class `?corpus=core|expansion|all` route param. The GUI passes it
 * through to the API (makeApiUrl / makeGroupByUrl / makeAutocompleteUrl); when
 * present it WINS over the legacy `?include_xpac=true` — the two never ride
 * together (the API 400s the combination).
 */
import { describe, it, expect, vi } from "vitest";

const { route } = vi.hoisted(() => {
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" } };
    const route = { value: { query: {}, params: { entityType: "works" } } };
    return { route };
});

vi.mock("@/router", () => ({
    default: {
        currentRoute: route,
        push: () => Promise.resolve(),
    },
}));
vi.mock("@/store", () => ({ default: { state: { serpGroupBy: {} }, getters: {} } }));

import { url } from "@/url";

const ROUTE = (query) => ({ query, params: { entityType: "works" } });

describe("url.corpusFromRouteQuery (#763)", () => {
    it("returns each valid corpus value", () => {
        expect(url.corpusFromRouteQuery({ corpus: "core" })).toBe("core");
        expect(url.corpusFromRouteQuery({ corpus: "expansion" })).toBe("expansion");
        expect(url.corpusFromRouteQuery({ corpus: "all" })).toBe("all");
    });

    it("is case-insensitive", () => {
        expect(url.corpusFromRouteQuery({ corpus: "All" })).toBe("all");
    });

    it("returns null for absent or junk values", () => {
        expect(url.corpusFromRouteQuery({})).toBeNull();
        expect(url.corpusFromRouteQuery({ corpus: "banana" })).toBeNull();
        expect(url.corpusFromRouteQuery({ corpus: "" })).toBeNull();
    });
});

describe("url.xpacIncludedInRoute (#763)", () => {
    it("reads both vocabularies", () => {
        expect(url.xpacIncludedInRoute({ corpus: "all" })).toBe(true);
        expect(url.xpacIncludedInRoute({ corpus: "expansion" })).toBe(true);
        expect(url.xpacIncludedInRoute({ corpus: "core" })).toBe(false);
        expect(url.xpacIncludedInRoute({ include_xpac: "true" })).toBe(true);
        expect(url.xpacIncludedInRoute({})).toBe(false);
    });

    it("corpus wins over a stray include_xpac (GUI-side preference)", () => {
        expect(url.xpacIncludedInRoute({ corpus: "core", include_xpac: "true" })).toBe(false);
    });
});

describe("makeApiUrl corpus passthrough (#763)", () => {
    it("sends corpus= and NOT include_xpac when the route has corpus", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ filter: "is_oa:true", corpus: "all" }));
        expect(apiUrl).toContain("corpus=all");
        expect(apiUrl).not.toContain("include_xpac");
    });

    it("still sends legacy include_xpac when corpus is absent", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ filter: "is_oa:true", include_xpac: "true" }));
        expect(apiUrl).toContain("include_xpac=true");
        expect(apiUrl).not.toContain("corpus=");
    });

    it("prefers corpus when a hand-edited URL carries both (never 400s the API)", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ corpus: "expansion", include_xpac: "true" }));
        expect(apiUrl).toContain("corpus=expansion");
        expect(apiUrl).not.toContain("include_xpac");
    });

    it("drops a junk corpus value instead of forwarding it", () => {
        const apiUrl = url.makeApiUrl(ROUTE({ filter: "is_oa:true", corpus: "banana" }));
        expect(apiUrl).not.toContain("corpus=");
    });
});

describe("makeGroupByUrl corpus passthrough (#763)", () => {
    it("carries the live route corpus into group-by fetches", () => {
        route.value = { query: { corpus: "all" }, params: { entityType: "works" } };
        const gbUrl = url.makeGroupByUrl("works", "is_oa");
        expect(gbUrl).toContain("corpus=all");
        expect(gbUrl).not.toContain("include_xpac");
        route.value = { query: {}, params: { entityType: "works" } };
    });
});
