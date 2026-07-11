// Live entity counts for the search-box placeholder (oxjob #598 round 5).
//
// Fetched once at app boot, fire-and-forget: one GET /entities (per-entity
// counts; its works count INCLUDES the expansion corpus, 512M-ish) plus one
// GET /works?per-page=1 (the default corpus=core count, 319M-ish). The
// placeholder shows the core count normally and the /entities (all) count
// when xpac is toggled on. Refs stay null/empty until the responses land —
// consumers fall back to their static placeholder text.

import { ref } from 'vue';
import axios from 'axios';
import { urlBase } from '@/apiConfig';

const MAILTO = 'mailto=ui@openalex.org';

// entity name -> count, from /entities. works = the ALL (xpac-inclusive) count.
export const entityCounts = ref({});
// the default-corpus (core) works count, from a plain /works query.
export const worksCoreCount = ref(null);

let fetched = false;
export function fetchEntityCounts() {
  if (fetched) return;
  fetched = true;
  axios.get(`${urlBase.api}/entities?${MAILTO}`)
    .then((resp) => {
      const counts = {};
      for (const e of resp.data?.results || []) counts[e.id] = e.count;
      entityCounts.value = counts;
    })
    .catch(() => {});
  axios.get(`${urlBase.api}/works?per-page=1&select=id&${MAILTO}`)
    .then((resp) => {
      worksCoreCount.value = resp.data?.meta?.count ?? null;
    })
    .catch(() => {});
}

// 512037511 -> "512M", 282590 -> "283K", 4516 -> "4,516"
export function compactCount(n) {
  if (!n || typeof n !== 'number') return null;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  if (n >= 1e4) return `${Math.round(n / 1e3)}K`;
  return n.toLocaleString();
}
