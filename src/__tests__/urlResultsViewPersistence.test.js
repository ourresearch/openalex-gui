/**
 * zd#8973 / oxjob #379: the results presentation (list vs table) persists across
 * searches via localStorage, the same way columns do. A bare URL (no `view`
 * param) inherits the user's last-used view; an explicit `?view=…` always wins.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { pushes, currentQuery } = vi.hoisted(() => {
    // Stateful localStorage so we can exercise read-after-write. url.js reads the
    // `localStorage` global lazily (inside readStoredResultsView), so a mutable
    // backing object is enough.
    const backing = {};
    const storage = {
        getItem: (k) => (k in backing ? backing[k] : null),
        setItem: (k, v) => { backing[k] = String(v); },
        removeItem: (k) => { delete backing[k]; },
    };
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" }, localStorage: storage };
    globalThis.localStorage = storage;
    return { pushes: [], currentQuery: { filter: "foo:bar" } };
});

vi.mock("@/router", () => ({
    default: {
        currentRoute: { value: { query: currentQuery } },
        push: (route) => { pushes.push(route); return Promise.resolve(); },
    },
}));
vi.mock("@/store", () => ({ default: { state: {} } }));

import { url } from "@/url";

describe("results-view persistence", () => {
    beforeEach(() => {
        pushes.length = 0;
        localStorage.removeItem("oax.resultsView");
    });

    it("defaults a bare URL to list when nothing is stored", () => {
        expect(url.isTableView({ query: {} })).toBe(false);
    });

    it("a bare URL inherits a stored table preference", () => {
        url.setResultsView("table");
        // setResultsView wrote localStorage; a later no-`view` route resolves it.
        expect(localStorage.getItem("oax.resultsView")).toBe("table");
        expect(url.isTableView({ query: {} })).toBe(true);
    });

    it("an explicit ?view=list overrides a stored table preference", () => {
        url.setResultsView("table");
        expect(url.isTableView({ query: { view: "list" } })).toBe(false);
    });

    it("switching back to list persists and a bare URL returns to list", () => {
        url.setResultsView("table");
        url.setResultsView("list");
        expect(localStorage.getItem("oax.resultsView")).toBe("list");
        expect(url.isTableView({ query: {} })).toBe(false);
    });
});
