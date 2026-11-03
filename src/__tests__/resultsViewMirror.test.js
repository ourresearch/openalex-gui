/**
 * oxjob #1694: the list/table view follows the SERP mode, and Serp.vue refetches when the
 * view changes (list and table page sizes differ, #1576). A mode that reads differently
 * while loading than once settled made that an endless fetch loop (the tab froze past
 * 1 GB on `?filter=publication_year:2024,title_and_abstract.search:kelp`). These tests
 * wire a fake fetch to the view the same way and count fetches.
 */
import { describe, it, expect } from "vitest";
import { ref, computed, watch, nextTick } from "vue";
import { mirrorModeToResultsView } from "@/components/Serp/resultsViewMirror";

// Serp.vue's shape: on a view change, set loading, await the (cached) response, settle.
function wireFetch(view, loading, cap = 200) {
    const counter = { fetches: 0 };
    watch(view, async () => {
        if (counter.fetches >= cap) return;
        counter.fetches++;
        loading.value = true;
        await Promise.resolve();
        loading.value = false;
    });
    return counter;
}
async function settle(ticks = 60) {
    for (let i = 0; i < ticks; i++) { await nextTick(); await Promise.resolve(); }
}

describe("mirrorModeToResultsView (#1694)", () => {
    it("the old wiring (view follows mode at once) loops when loading flips the mode", async () => {
        const loading = ref(true);
        const view = ref("list");
        const mode = computed(() => (loading.value ? "advanced" : "basic"));
        const counter = wireFetch(view, loading, 40);
        watch(mode, (m) => { view.value = m === "basic" ? "list" : "table"; }, { immediate: true });
        loading.value = false;
        await settle(200);
        expect(counter.fetches).toBe(40); // hit the cap: it never stops on its own
    });

    it("converges when loading flips the mode", async () => {
        const loading = ref(true);
        const view = ref("list");
        const mode = computed(() => (loading.value ? "advanced" : "basic"));
        const counter = wireFetch(view, loading, 40);
        mirrorModeToResultsView(mode, () => loading.value, (v) => { view.value = v; });
        loading.value = false;
        await settle(200);
        expect(counter.fetches).toBeLessThanOrEqual(2);
        expect(view.value).toBe("list"); // ends on the settled mode's view
    });

    it("writes the first view at once, even while the first load is in flight (#1576)", () => {
        const loading = ref(true);
        const view = ref("list");
        mirrorModeToResultsView(ref("advanced"), () => loading.value, (v) => { view.value = v; });
        expect(view.value).toBe("table");
    });

    it("applies a mode switch made during a load once the load settles", async () => {
        const loading = ref(false);
        const view = ref("list");
        const mode = ref("basic");
        mirrorModeToResultsView(mode, () => loading.value, (v) => { view.value = v; });
        loading.value = true;
        mode.value = "advanced";
        await settle(5);
        expect(view.value).toBe("list");
        loading.value = false;
        await settle(5);
        expect(view.value).toBe("table");
    });

    it("follows a mode switch at once when nothing is loading", async () => {
        const view = ref("list");
        const mode = ref("basic");
        mirrorModeToResultsView(mode, () => false, (v) => { view.value = v; });
        mode.value = "oql";
        await settle(2);
        expect(view.value).toBe("table");
    });
});
