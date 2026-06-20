/**
 * zd#8973 / oxjob #379 + #492: the results presentation (list vs table) is
 * recipient-local SERP CHROME. It is kept OFF the URL and lives in the reactive
 * Vuex store (`serpResultsView`), persisted to localStorage (`oax.resultsView`)
 * so a bare URL inherits the user's last-used view. A LEGACY inbound `?view=`
 * param is still honored for first paint (then seeded into the store + stripped).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { pushes } = vi.hoisted(() => {
    // Stateful localStorage so we can exercise read-after-write.
    const backing = {};
    const storage = {
        getItem: (k) => (k in backing ? backing[k] : null),
        setItem: (k, v) => { backing[k] = String(v); },
        removeItem: (k) => { delete backing[k]; },
    };
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" }, localStorage: storage };
    globalThis.localStorage = storage;
    return { pushes: [] };
});

vi.mock("@/router", () => ({
    default: {
        currentRoute: { value: { query: {} } },
        push: (route) => { pushes.push(route); return Promise.resolve(); },
    },
}));
// Store mock mirrors the real store: setSerpResultsView sets reactive state and,
// when persist:true, writes localStorage; the state is what isTableView reads.
vi.mock("@/store", () => {
    const state = { serpResultsView: "list", serpShowApi: false };
    return {
        default: {
            state,
            commit: (type, payload) => {
                if (type === "setSerpResultsView") {
                    state.serpResultsView = payload.value === "table" ? "table" : "list";
                    if (payload.persist) localStorage.setItem("oax.resultsView", state.serpResultsView);
                } else if (type === "setSerpShowApi") {
                    state.serpShowApi = !!payload;
                }
            },
        },
    };
});

import { url } from "@/url";
import store from "@/store";

describe("results-view persistence (store-backed, #492)", () => {
    beforeEach(() => {
        pushes.length = 0;
        localStorage.removeItem("oax.resultsView");
        store.state.serpResultsView = "list";
    });

    it("defaults a bare URL to list when the store is list", () => {
        expect(url.isTableView({ query: {} })).toBe(false);
    });

    it("setResultsView commits the store, persists localStorage, and never pushes the URL", () => {
        url.setResultsView("table");
        expect(store.state.serpResultsView).toBe("table");
        expect(localStorage.getItem("oax.resultsView")).toBe("table");
        expect(pushes).toHaveLength(0); // view is chrome, not a navigation
        expect(url.isTableView({ query: {} })).toBe(true);
    });

    it("a LEGACY explicit ?view=list still wins for that paint", () => {
        url.setResultsView("table");
        expect(url.isTableView({ query: { view: "list" } })).toBe(false);
    });

    it("a LEGACY explicit ?view=table is honored even when the store says list", () => {
        expect(url.isTableView({ query: { view: "table" } })).toBe(true);
    });

    it("switching back to list persists and a bare URL returns to list", () => {
        url.setResultsView("table");
        url.setResultsView("list");
        expect(localStorage.getItem("oax.resultsView")).toBe("list");
        expect(url.isTableView({ query: {} })).toBe(false);
    });
});
