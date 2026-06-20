/**
 * Regression for oxjob #304 post-QA: the export dialog's "Open in table view"
 * must carry the selected columns. `column` is still a URL param, so it goes via
 * a single push. The results-view (list/table) is now recipient-local CHROME in
 * the reactive store (#492), NOT a URL param — so it must never appear in the
 * pushed query, and must be committed to the store instead.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { pushes, currentQuery } = vi.hoisted(() => {
    // url.js (and its transitive imports) touch `window`/`localStorage` at load;
    // the vitest env is "node", so provide minimal stubs before importing it.
    const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" }, localStorage: noopStorage };
    globalThis.localStorage = globalThis.localStorage || noopStorage;
    return { pushes: [], currentQuery: { filter: "foo:bar" } };
});

vi.mock("@/router", () => ({
    default: {
        currentRoute: { value: { query: currentQuery } },
        push: (route) => { pushes.push(route); return Promise.resolve(); },
    },
}));
// Store mock mirrors the real setSerpResultsView mutation (#492) so we can assert
// the view choice lands in the store, not the URL.
vi.mock("@/store", () => {
    const state = { serpResultsView: "list", serpShowApi: false };
    return {
        default: {
            state,
            commit: (type, payload) => {
                if (type === "setSerpResultsView") {
                    state.serpResultsView = payload.value === "table" ? "table" : "list";
                }
            },
        },
    };
});

import { url } from "@/url";
import store from "@/store";

describe("setColumnsAndResultsView", () => {
    beforeEach(() => { pushes.length = 0; store.state.serpResultsView = "list"; });

    it("sets columns in ONE navigation; the view goes to the store, not the URL", () => {
        url.setColumnsAndResultsView(["display_name", "ids.openalex", "works_count"], "table");
        expect(pushes).toHaveLength(1);
        expect(pushes[0].query.column).toBe("display_name,ids.openalex,works_count");
        // view is store chrome now — never in the URL
        expect(pushes[0].query.view).toBeUndefined();
        expect(store.state.serpResultsView).toBe("table");
        // existing params preserved
        expect(pushes[0].query.filter).toBe("foo:bar");
    });

    it("list view still sets columns and commits list to the store", () => {
        url.setColumnsAndResultsView(["display_name"], "list");
        expect(pushes).toHaveLength(1);
        expect(pushes[0].query.column).toBe("display_name");
        expect(pushes[0].query.view).toBeUndefined();
        expect(store.state.serpResultsView).toBe("list");
    });
});
