#!/usr/bin/env node
// Regenerates src/metaSnapshot.json — the build-time snapshot of the server's
// /meta catalog that seeds src/metaCatalog.js synchronously at boot (oxjob #424).
// The runtime fetch in metaCatalog.js refreshes the same data on app start, so
// this snapshot only needs regenerating occasionally (it bounds how stale a
// label can be when the runtime fetch fails or hasn't landed yet).
//
// Usage: node scripts/generate-meta-snapshot.mjs [apiBase]
//   apiBase defaults to https://api.openalex.org
//   Sends OPENALEX_API_KEY from the environment when set (keyless calls can 429).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = process.argv[2] || "https://api.openalex.org";
const MAILTO = "ui@openalex.org";
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "metaSnapshot.json"
);

// Keep this trimming logic in sync with mergePayloads() in src/metaCatalog.js —
// both reduce the server payloads to exactly the keys the GUI derives.
const trim = (propsPayload, entitiesPayload) => {
  const properties = {};
  const aliases = {};
  for (const [entity, props] of Object.entries(propsPayload.properties)) {
    properties[entity] = {};
    aliases[entity] = {};
    for (const [key, p] of Object.entries(props)) {
      if (p.display_name) properties[entity][key] = p.display_name;
      // alias -> canonical (#655). Skip an alias that is also a canonical key of
      // this entity (`id` on authors/institutions/topics): ambiguous, keep exact.
      for (const alias of p.alternate_keys ?? []) {
        if (!(alias in props)) aliases[entity][alias] = key;
      }
    }
  }
  const entities = {};
  for (const e of entitiesPayload.results) {
    entities[e.id] = {
      displayName: e.display_name,
      displayNameSingular: e.display_name_singular,
    };
  }
  return {
    version: propsPayload.meta?.version ?? null,
    fingerprint: propsPayload.meta?.fingerprint ?? null,
    generatedAt: new Date().toISOString(),
    entities,
    properties,
    aliases,
  };
};

const API_KEY = process.env.OPENALEX_API_KEY;
const getJson = async (url) => {
  const resp = await fetch(API_KEY ? `${url}&api_key=${API_KEY}` : url);
  if (!resp.ok) throw new Error(`${url} -> HTTP ${resp.status}`);
  return resp.json();
};

const [propsPayload, entitiesPayload] = await Promise.all([
  getJson(`${API}/properties?mailto=${MAILTO}`),
  getJson(`${API}/meta/entities?mailto=${MAILTO}`),
]);

const snapshot = trim(propsPayload, entitiesPayload);
fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 1) + "\n");

const nProps = Object.values(snapshot.properties).reduce(
  (n, m) => n + Object.keys(m).length,
  0
);
console.log(
  `wrote ${path.relative(process.cwd(), OUT)}: properties_version ${snapshot.version}, ` +
    `${Object.keys(snapshot.entities).length} entities, ${nProps} property labels, ` +
    `${Object.values(snapshot.aliases).reduce((n, m) => n + Object.keys(m).length, 0)} key aliases`
);
