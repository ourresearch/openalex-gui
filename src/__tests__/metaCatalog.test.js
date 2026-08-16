// oxjob #424: entity/facet identity labels derive from the server /meta
// catalog (snapshot-seeded via src/metaSnapshot.json, live-refreshed at boot).
import { describe, it, expect } from "vitest";
import snapshot from "@/metaSnapshot.json";
import { getPropertyDisplayName, getEntityIdentity } from "@/metaCatalog";
import { facetConfigs } from "@/facetConfigs";
import { getEntityConfigs } from "@/entityConfigs";

describe("metaCatalog", () => {
  it("serves snapshot labels, including the types→work-types entity mapping", () => {
    expect(getPropertyDisplayName("works", "open_access.is_oa")).toBe(
      snapshot.properties.works["open_access.is_oa"]
    );
    expect(getEntityIdentity("types").displayName).toBe(
      snapshot.entities["work-types"].displayName
    );
  });

  it("gives every facet a non-empty displayName (sort crash guard)", () => {
    for (const f of facetConfigs()) {
      expect(typeof f.displayName, `${f.entityToFilter}/${f.key}`).toBe("string");
      expect(f.displayName.length, `${f.entityToFilter}/${f.key}`).toBeGreaterThan(0);
    }
  });

  it("keeps every non-verbatim facet label consistent with the server catalog", () => {
    // The client-side twin of elastic-api's check_label_consistency.py gate:
    // an authored displayName may fix casing but never diverge in words.
    for (const f of facetConfigs()) {
      if (f.displayNameVerbatim) continue;
      const server = getPropertyDisplayName(f.entityToFilter, f.key);
      if (server === undefined) continue;
      expect(
        f.displayName.toLowerCase(),
        `${f.entityToFilter}/${f.key}`
      ).toBe(server.toLowerCase());
    }
  });

  it("fills entity identity for every entity (derived or authored override)", () => {
    for (const c of getEntityConfigs()) {
      expect(typeof c.displayName, c.name).toBe("string");
      expect(typeof c.displayNameSingular, c.name).toBe("string");
    }
  });
});
