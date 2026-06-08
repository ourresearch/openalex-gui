/**
 * oxjob #397: how a search hydrates into the box from the URL.
 *
 * - getSearchFromRoute reads ONLY the canonical top-level `search.*=` params the box emits.
 * - filterSearchRedirectQuery normalizes a shared/legacy/API-style URL that runs a search
 *   via a single `filter=<scope>.search:<terms>` clause to that canonical shape up front
 *   (router guard), so the box never reads the filter form and shared URLs no longer land
 *   on an empty-looking box + "No filters applied".
 */
import { describe, it, expect, vi } from "vitest";

vi.hoisted(() => {
    const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" }, localStorage: storage };
    globalThis.localStorage = storage;
});

vi.mock("@/router", () => ({
    default: { currentRoute: { value: { query: {} } }, push: () => Promise.resolve() },
}));
vi.mock("@/store", () => ({ default: { state: {} } }));

import { url } from "@/url";

const get = (query) => url.getSearchFromRoute({ query });
const redirect = (query) => url.filterSearchRedirectQuery(query);

describe("getSearchFromRoute — top-level search params only (canonical)", () => {
    it("reads a plain ?search=", () => {
        expect(get({ search: "foo" })).toEqual({ type: "search", value: "foo" });
    });
    it("reads ?search.title_and_abstract=", () => {
        expect(get({ "search.title_and_abstract": "climate change" }))
            .toEqual({ type: "search.title_and_abstract", value: "climate change" });
    });
    it("returns null for a search carried only in filter= (handled by the redirect, not the box)", () => {
        expect(get({ filter: "title_and_abstract.search:foo" })).toBeNull();
        expect(get({ filter: "is_oa:true" })).toBeNull();
        expect(get({})).toBeNull();
    });
});

describe("filterSearchRedirectQuery — normalize single filter=*.search clause (#397)", () => {
    it("rewrites title_and_abstract.search to the top-level search param", () => {
        expect(redirect({ filter: "title_and_abstract.search:climate change" }))
            .toEqual({ "search.title_and_abstract": "climate change" });
    });
    it("maps the deprecated default.search to the all/stemmed scope", () => {
        expect(redirect({ filter: "default.search:photosynthesis" }))
            .toEqual({ search: "photosynthesis" });
    });
    it("maps fulltext.search, title.search and the .exact variants", () => {
        expect(redirect({ filter: "fulltext.search:foo" })).toEqual({ search: "foo" });
        expect(redirect({ filter: "title.search:foo" })).toEqual({ "search.title": "foo" });
        expect(redirect({ filter: "title.search.exact:bar" })).toEqual({ "search.title.exact": "bar" });
        expect(redirect({ filter: "title_and_abstract.search.exact:baz" }))
            .toEqual({ "search.title_and_abstract.exact": "baz" });
    });
    it("preserves other query params (page, sort, data-version) while dropping filter=", () => {
        expect(redirect({ filter: "title.search:foo", page: "2", sort: "cited_by_count:desc" }))
            .toEqual({ "search.title": "foo", page: "2", sort: "cited_by_count:desc" });
    });
    it("does NOT redirect a multi-filter URL (other clauses stay as chips; OQL territory)", () => {
        expect(redirect({ filter: "title_and_abstract.search:x,is_oa:true" })).toBeNull();
        expect(redirect({ filter: "is_oa:true,title.search:foo" })).toBeNull();
    });
    it("does NOT redirect a negated search clause", () => {
        expect(redirect({ filter: "!title.search:foo" })).toBeNull();
    });
    it("does NOT redirect a .search key with no UI scope equivalent", () => {
        expect(redirect({ filter: "keyword.search:foo" })).toBeNull();
        expect(redirect({ filter: "abstract.search:foo" })).toBeNull();
    });
    it("does NOT redirect a non-search filter, an empty value, or no filter", () => {
        expect(redirect({ filter: "is_oa:true" })).toBeNull();
        expect(redirect({ filter: "title.search:" })).toBeNull();
        expect(redirect({})).toBeNull();
        expect(redirect({ search: "foo" })).toBeNull();
    });
});
