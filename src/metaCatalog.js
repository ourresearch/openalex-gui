// Runtime client of the server /meta catalog (oxjob #424).
//
// The server (openalex-elastic-api /properties + /meta/entities, built by oxjob
// #405) is the source of truth for entity/property *identity*. This module
// seeds a reactive catalog from the committed build-time snapshot
// (src/metaSnapshot.json, regenerated via scripts/generate-meta-snapshot.mjs)
// so every consumer can read it synchronously at import time, then refreshes it
// once per app boot from the live API (fired from main.js, same pattern as
// entityCounts.js). If the fetch fails the snapshot stands — the app never
// blocks or breaks on catalog availability.
//
// What is derived from the catalog today: facet displayNames (see
// facetConfigs.js — authored values win where they exist) and entity
// displayName/displayNameSingular (see entityConfigs.js). The other config
// keys are client vocabularies (type/actions/category) or client-only concerns;
// widening what the server carries is oxjob #795.
//
// This module must stay importable with no `window` (vitest runs environment:
// 'node'), so apiConfig — which reads window.location at module scope — is
// imported lazily inside fetchMetaCatalog().

import { reactive } from "vue";
import snapshot from "./metaSnapshot.json";

// GUI entity names that differ from the server's entity ids.
const GUI_TO_SERVER_ENTITY = {
  types: "work-types",
};

const serverEntityId = (entityType) =>
  GUI_TO_SERVER_ENTITY[entityType] ?? entityType;

const catalog = reactive({
  version: snapshot.version,
  entities: { ...snapshot.entities },
  // entity -> { propertyKey -> displayName }
  properties: Object.fromEntries(
    Object.entries(snapshot.properties).map(([e, m]) => [e, { ...m }])
  ),
});

// The server's display_name for a property, or undefined if the server doesn't
// know the (entityType, key) pair. entityType is the GUI name (e.g. "types").
const getPropertyDisplayName = (entityType, key) =>
  catalog.properties[serverEntityId(entityType)]?.[key];

// The server's identity block for an entity ({displayName,
// displayNameSingular}), or undefined (e.g. "locations", which /meta/entities
// doesn't serve).
const getEntityIdentity = (entityType) =>
  catalog.entities[serverEntityId(entityType)];

// Subscribers are called after the live fetch merges into the catalog, so
// plain (non-reactive) memo caches derived from it can invalidate — e.g.
// builderFieldMeta's curated-fields cache.
const subscribers = new Set();
const onCatalogUpdated = (cb) => {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
};

// Keep this trimming in sync with trim() in scripts/generate-meta-snapshot.mjs.
const mergePayloads = (propsPayload, entitiesPayload) => {
  for (const [entity, props] of Object.entries(propsPayload.properties)) {
    const m = catalog.properties[entity] ?? (catalog.properties[entity] = {});
    for (const [key, p] of Object.entries(props)) {
      if (p.display_name) m[key] = p.display_name;
    }
  }
  for (const e of entitiesPayload.results) {
    catalog.entities[e.id] = {
      displayName: e.display_name,
      displayNameSingular: e.display_name_singular,
    };
  }
  catalog.version = propsPayload.meta?.version ?? catalog.version;
};

let fetchPromise = null;
const fetchMetaCatalog = () => {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const [{ default: axios }, { urlBase }] = await Promise.all([
      import("axios"),
      import("@/apiConfig"),
    ]);
    const mailto = "mailto=ui@openalex.org";
    const [propsResp, entitiesResp] = await Promise.all([
      axios.get(`${urlBase.api}/properties?${mailto}`),
      axios.get(`${urlBase.api}/meta/entities?${mailto}`),
    ]);
    mergePayloads(propsResp.data, entitiesResp.data);
    subscribers.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.warn("metaCatalog: onCatalogUpdated subscriber threw", e);
      }
    });
  })().catch((e) => {
    // Snapshot data stands; allow a later retry.
    console.warn("metaCatalog: live /meta refresh failed, using snapshot", e);
    fetchPromise = null;
  });
  return fetchPromise;
};

export {
  catalog,
  getPropertyDisplayName,
  getEntityIdentity,
  onCatalogUpdated,
  fetchMetaCatalog,
};
