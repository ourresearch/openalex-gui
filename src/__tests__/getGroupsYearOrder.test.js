/**
 * zd#8363: the "More…" picker for the year distribution (FilterSelectAddOption →
 * api.getSuggestions → api.getGroups) showed years in the API's count-descending
 * order, so the list was scrambled and you couldn't see the data's range. getGroups
 * now sorts year fields chronologically (descending) so the popup — and the card
 * histogram, which reads the same data — are both year-ordered.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.hoisted(() => {
    globalThis.window = globalThis.window || { addEventListener: () => {}, location: { href: "", origin: "" } };
});

vi.mock("@/router", () => ({
    default: {
        currentRoute: { value: { query: {}, params: { entityType: "works" } } },
        push: () => Promise.resolve(),
    },
}));
vi.mock("@/store", () => ({ default: { state: { useV2: false, user: {} } } }));
vi.mock("axios", () => ({ default: { get: vi.fn(), request: vi.fn() } }));

import axios from "axios";
import { api } from "@/api";

describe("getGroups year ordering (zd#8363)", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("sorts publication_year groups chronologically (descending), not by count", async () => {
        axios.get.mockResolvedValue({ data: { group_by: [
            { key: "2015", key_display_name: "2015", count: 50 },
            { key: "2020", key_display_name: "2020", count: 90 },
            { key: "2008", key_display_name: "2008", count: 70 },
            { key: "2022", key_display_name: "2022", count: 10 },
        ] } });
        const groups = await api.getGroups("works", "publication_year", { hideUnknown: true, filters: [] });
        expect(groups.map(g => g.value)).toEqual(["2022", "2020", "2015", "2008"]);
    });

    it("leaves a non-year field in the API's original (count-descending) order", async () => {
        axios.get.mockResolvedValue({ data: { group_by: [
            { key: "https://openalex.org/T1", key_display_name: "Topic B", count: 90 },
            { key: "https://openalex.org/T2", key_display_name: "Topic A", count: 50 },
        ] } });
        const groups = await api.getGroups("works", "primary_topic.id", { hideUnknown: true, filters: [] });
        expect(groups.map(g => g.displayValue)).toEqual(["Topic B", "Topic A"]);
    });
});
