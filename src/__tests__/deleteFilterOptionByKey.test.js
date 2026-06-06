/**
 * zd#7179: unticking a facet option (e.g. a work type) in the sidebar must remove
 * ONLY that option from its own filter. The old deleteFilterOptionByKey mapped
 * deleteOptionFromFilterValue over *every* filter, which re-serialized unrelated
 * ones and lowercased their values (optionsFromString lowercases). For a
 * `default.search` filter that turned the Boolean operators `OR`/`AND` into
 * literal `or`/`and`, silently changing the result count — the user saw 4,200
 * results become 1,005 after unticking "preprint", instead of returning to 4,200.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { pushes, route } = vi.hoisted(() => {
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" } };
    const route = { value: { query: { filter: "" }, params: { entityType: "works" } } };
    return { pushes: [], route };
});

vi.mock("@/router", () => ({
    default: {
        currentRoute: route,
        push: (r) => { pushes.push(r); return Promise.resolve(); },
    },
}));
vi.mock("@/store", () => ({ default: { state: {} } }));

import { url } from "@/url";

const setFilter = (filter) => { route.value.query = { filter }; };
const lastPushedFilter = () => pushes[pushes.length - 1]?.query?.filter;

describe("deleteFilterOptionByKey (zd#7179)", () => {
    beforeEach(() => { pushes.length = 0; });

    it("leaves a Boolean default.search value byte-for-byte intact when a type is unticked", async () => {
        setFilter("default.search:vaping OR vape,type:preprint");
        await url.deleteFilterOptionByKey("works", "type", "preprint");
        // Boolean operator case preserved; the type filter is gone entirely.
        expect(lastPushedFilter()).toBe("default.search:vaping OR vape");
    });

    it("preserves an AND query and quoted phrases when a type is unticked", async () => {
        setFilter('default.search:cigarette AND nicotine,type:preprint');
        await url.deleteFilterOptionByKey("works", "type", "preprint");
        expect(lastPushedFilter()).toBe("default.search:cigarette AND nicotine");
    });

    it("removes only the unticked option from a multi-value type filter", async () => {
        setFilter("default.search:vaping OR vape,type:article|preprint");
        await url.deleteFilterOptionByKey("works", "type", "preprint");
        expect(lastPushedFilter()).toBe("default.search:vaping OR vape,type:article");
    });

    it("drops the whole filter (no empty clause) when the last option is unticked", async () => {
        setFilter("type:preprint");
        await url.deleteFilterOptionByKey("works", "type", "preprint");
        // No filters left → no filter param pushed.
        expect(lastPushedFilter()).toBeUndefined();
    });
});
