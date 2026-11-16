// oxjob #1027 (ZD 23972): the works CSV can carry the PDF and open access links again.
import { describe, it, expect } from "vitest";
import { getColumnExportSpec, resolveColumn, isColumnEligible } from "@/components/Results/Table/columnConfig";
import { getFacetConfig } from "@/facetConfigUtils";

describe("works link columns", () => {
    it("PDF URL is a column that exports best_oa_location.pdf_url", () => {
        expect(isColumnEligible(getFacetConfig("works", "best_oa_location.pdf_url"))).toBe(true);
        expect(getColumnExportSpec("works", "best_oa_location.pdf_url"))
            .toEqual({ path: "best_oa_location.pdf_url", header: "PDF URL" });
        const col = resolveColumn("works", "best_oa_location.pdf_url");
        expect(col.extractFn({ best_oa_location: { pdf_url: "https://x.org/a.pdf" } })).toBe("https://x.org/a.pdf");
        expect(col.extractFn({ best_oa_location: null })).toBeUndefined();
    });
    it("Open access URL is a column that exports open_access.oa_url", () => {
        expect(getColumnExportSpec("works", "open_access.oa_url"))
            .toEqual({ path: "open_access.oa_url", header: "Open access URL" });
    });
});
