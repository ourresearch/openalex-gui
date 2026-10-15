import { describe, it, expect } from "vitest";
import { entityConfigs } from "@/entityConfigs";
import { getFacetConfig } from "@/facetConfigUtils";

// #1689: an entity-page metric with no facet config renders nothing and logs
// "no facet found" on every server render (awards did, ~0.3 lines/s).
describe("entity-page metrics", () => {
  for (const [type, config] of Object.entries(entityConfigs)) {
    for (const key of config.metricsToShowOnEntityPage || []) {
      it(`${type}: ${key} has a facet config`, () => {
        expect(getFacetConfig(type, key)).toBeTruthy();
      });
    }
  }
});
