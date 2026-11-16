// oxjob #1686 — the work page links each of the work's keywords to its keyword page, so crawlers that
// read work pages reach the keyword (subject) pages.
import { describe, it, expect } from "vitest";
import { getFacetConfig } from "@/facetConfigUtils";
import { getEntityConfig } from "@/entityConfigs";
import { entityLinkItems } from "@/components/Entity/entityDatumValues";

const KEYWORDS = [
  { id: "https://openalex.org/keywords/open-access", display_name: "open access", score: 0.98 },
  { id: "https://openalex.org/keywords/citation-impact", display_name: "citation impact", score: 0.96 },
];

describe("work page keywords row", () => {
  it("sits after the topic rows", () => {
    const rows = getEntityConfig("works").rowsToShowOnEntityPage;
    expect(rows.indexOf("keywords.id")).toBe(rows.indexOf("primary_topic.domain.id") + 1);
  });

  it("renders every keyword as an entity link, with no score", () => {
    const fc = getFacetConfig("works", "keywords.id");
    expect(entityLinkItems(fc.extractFn({ keywords: KEYWORDS }))).toEqual(KEYWORDS);
    expect(fc.showScorePercent).toBeFalsy();
    expect(fc.extractFn({ keywords: [] })).toEqual([]);
  });

  // The link itself (/keywords/<slug>, no case change) is covered by recordRoutes.test.js canonicalRecordId.
});
