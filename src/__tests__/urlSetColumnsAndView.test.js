/**
 * Regression for oxjob #304 post-QA: the export dialog's "Open in table view"
 * must carry the selected columns. The old code called setColumn() then
 * setResultsView() back-to-back; since router.push is async but each helper
 * reads router.currentRoute.value.query synchronously, the second push read the
 * stale (pre-nav) query and dropped `column=`. setColumnsAndResultsView() does
 * both in a SINGLE push, so the columns survive.
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
vi.mock("@/store", () => ({ default: { state: {} } }));

import { url } from "@/url";

describe("setColumnsAndResultsView", () => {
    beforeEach(() => { pushes.length = 0; });

    it("sets column + view=table in ONE navigation", () => {
        url.setColumnsAndResultsView(["display_name", "ids.openalex", "works_count"], "table");
        expect(pushes).toHaveLength(1);
        expect(pushes[0].query.column).toBe("display_name,ids.openalex,works_count");
        expect(pushes[0].query.view).toBe("table");
        // existing params preserved
        expect(pushes[0].query.filter).toBe("foo:bar");
    });

    it("list view clears the view param but still sets columns", () => {
        url.setColumnsAndResultsView(["display_name"], "list");
        expect(pushes).toHaveLength(1);
        expect(pushes[0].query.column).toBe("display_name");
        expect(pushes[0].query.view).toBeUndefined();
    });
});
