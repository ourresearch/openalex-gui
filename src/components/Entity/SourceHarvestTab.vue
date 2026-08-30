<template>
  <div class="pa-6 source-harvest-tab">

    <!-- Harvest status -->
    <div class="text-overline">Harvest status</div>
    <div v-if="loadingLocations" class="my-2">
      <v-skeleton-loader type="text" max-width="300" />
    </div>
    <template v-else>
      <div v-if="lastHarvestedDate" class="text-h6 font-weight-regular">
        Last new records received:
        <span class="font-weight-medium">{{ formatDate(lastHarvestedDate) }}</span>
        <span class="text-medium-emphasis"> ({{ relativeDate(lastHarvestedDate) }})</span>
      </div>
      <div v-else class="text-h6 font-weight-regular text-medium-emphasis">
        No harvest date on record for this source.
      </div>
      <div class="text-body-2 text-medium-emphasis mt-1">
        We check every repository for new records daily. This date is when we last
        received a record we didn't already have — if your repository hasn't changed,
        the date doesn't either.
      </div>
    </template>

    <v-divider class="my-5" />

    <!-- Counts -->
    <div class="text-overline">What we've harvested</div>
    <div v-if="loadingLocations || loadingWorksCounts" class="my-2">
      <v-skeleton-loader type="text@3" max-width="400" />
    </div>
    <table v-else class="harvest-counts my-2">
      <tbody>
        <tr>
          <td class="count-cell">{{ formatCount(locationsCount) }}</td>
          <td>
            records (locations) harvested from this source
            <a :href="locationsApiUrl" target="_blank" rel="noopener" class="text-decoration-none ml-1" title="View raw data in the OpenAlex API">
              <v-icon size="14">mdi-api</v-icon>
            </a>
          </td>
        </tr>
        <tr>
          <td class="count-cell">
            <router-link v-if="worksAnyCount !== null" :to="worksAnyLink">{{ formatCount(worksAnyCount) }}</router-link>
            <template v-else>—</template>
          </td>
          <td>works include this source as a location</td>
        </tr>
        <tr>
          <td class="count-cell">
            <router-link v-if="worksPrimaryCount !== null" :to="worksPrimaryLink">{{ formatCount(worksPrimaryCount) }}</router-link>
            <template v-else>—</template>
          </td>
          <td>works have this source as their primary location</td>
        </tr>
      </tbody>
    </table>
    <div class="text-body-2">
      <a :href="docsWorksUrl" target="_blank" rel="noopener">
        Why are these numbers different? How locations become works
        <v-icon size="14">mdi-open-in-new</v-icon>
      </a>
    </div>

    <v-divider class="my-5" />

    <!-- Endpoints on file -->
    <div class="text-overline">
      Endpoints on file
      <span v-if="endpoints.length" class="text-medium-emphasis">({{ endpoints.length }})</span>
    </div>
    <div v-if="loadingEndpoints" class="my-2">
      <v-skeleton-loader type="text@2" max-width="500" />
    </div>
    <template v-else-if="endpoints.length">
      <div class="text-body-2 text-medium-emphasis mb-2">
        The OAI-PMH endpoint{{ endpoints.length === 1 ? '' : 's' }} we harvest this
        source from. Use the links to see exactly what your endpoint is serving us.
      </div>
      <div
        v-for="endpoint in visibleEndpoints"
        :key="endpoint.id"
        class="endpoint-row py-2"
      >
        <code class="endpoint-url">{{ endpoint.pmh_url }}</code>
        <span v-if="endpoint.metadata_prefix" class="text-caption text-medium-emphasis ml-2">{{ endpoint.metadata_prefix }}</span>
        <span v-if="endpoint.set" class="text-caption text-medium-emphasis ml-2">set: {{ endpoint.set }}</span>
        <span class="text-caption ml-2 text-no-wrap">
          <a :href="identifyUrl(endpoint)" target="_blank" rel="noopener">Identify</a>
          ·
          <a :href="listRecordsUrl(endpoint)" target="_blank" rel="noopener">recent records</a>
        </span>
        <div v-if="endpoint.last_harvest" class="text-caption mt-1">
          <span :class="endpoint.last_harvest.status === 'success' ? 'health-ok' : 'health-bad'">●</span>
          <span class="text-medium-emphasis ml-1">{{ healthLabel(endpoint) }}</span>
          <div
            v-if="endpoint.last_harvest.status !== 'success' && endpoint.last_harvest.error_message"
            class="text-medium-emphasis error-detail"
          >
            {{ endpoint.last_harvest.error_message }}
          </div>
        </div>
      </div>
      <v-btn
        v-if="endpoints.length > endpointDisplayCap && !showAllEndpoints"
        variant="text"
        size="small"
        color="primary"
        prepend-icon="mdi-chevron-down"
        @click="showAllEndpoints = true"
      >
        Show all {{ endpoints.length }} endpoints
      </v-btn>
    </template>
    <div v-else class="text-body-2 text-medium-emphasis">
      We don't have an OAI-PMH endpoint on file for this source.
      If you manage this repository and want it harvested, email
      <a href="mailto:support@openalex.org">support@openalex.org</a>.
    </div>

    <v-divider class="my-5" />

    <!-- Docs + support -->
    <div class="text-body-2">
      <div>
        <a :href="docsRepositoriesUrl" target="_blank" rel="noopener">
          How OpenAlex works with repositories
          <v-icon size="14">mdi-open-in-new</v-icon>
        </a>
      </div>
      <div class="mt-1 text-medium-emphasis">
        Wrong endpoint? Missing records? Email
        <a href="mailto:support@openalex.org">support@openalex.org</a>
        — a human (or a very careful robot) reads every message.
      </div>
    </div>

  </div>
</template>

<script setup>
// Harvest tab on repository source pages (oxjob #836).
//
// Data-source rules (see #836 EXPLORE.md, 2026-08-30):
// - Counts + last-harvested come from api.openalex.org (/locations; ingested_at =
//   S3 file mtime = real harvest-delivery time via #911).
// - Endpoints + live per-endpoint harvest health come from
//   user.openalex.org/oaipmh-sets (#804) — the live registry, written nightly by
//   the harvester. (Replaced the legacy /repositories endpoint, which served a
//   frozen 2024 copy; its stale telemetry was never displayed here.)
// - last_harvest.record_count is null for endpoints not harvested since
//   2026-08-30 (the column is new) — render it only when present.
// - A harvest-history chart is deliberately absent: ingested_at is keyword-typed
//   in locations-v2, so date-range filters silently return 0 until the v3 reindex.
import { ref, computed, watch } from 'vue';
import axios from 'axios';

import { api } from '@/api';
import { urlBase, axiosConfig } from '@/apiConfig';
import { createSimpleFilter } from '@/filterConfigs';

defineOptions({ name: 'SourceHarvestTab' });

const props = defineProps({
  entityData: { type: Object, required: true },
});

const shortId = computed(() => {
  const id = props.entityData?.id || '';
  return (String(id).match(/S\d+/i) || [''])[0].toUpperCase();
});

// --- last harvested + locations count (one API call) ---
const loadingLocations = ref(true);
const lastHarvestedDate = ref(null);
const locationsCount = ref(null);

// --- works counts ---
const loadingWorksCounts = ref(true);
const worksAnyCount = ref(null);
const worksPrimaryCount = ref(null);

// --- endpoints on file ---
const loadingEndpoints = ref(true);
const endpoints = ref([]);
const showAllEndpoints = ref(false);
const endpointDisplayCap = 10;

const visibleEndpoints = computed(() =>
  showAllEndpoints.value ? endpoints.value : endpoints.value.slice(0, endpointDisplayCap)
);

const locationsApiUrl = computed(() =>
  `${urlBase.api}/locations?filter=source_id:${shortId.value}`
);

const docsWorksUrl = 'https://help.openalex.org/data/works/';
const docsRepositoriesUrl = 'https://help.openalex.org/data/sources/repositories/';

const worksAnyLink = computed(() => serpLink('locations.source.id'));
const worksPrimaryLink = computed(() => serpLink('primary_location.source.id'));

function serpLink(filterKey) {
  const filter = createSimpleFilter('works', filterKey, shortId.value);
  return {
    name: 'Serp',
    params: { entityType: 'works' },
    query: { filter: filter.asStr },
  };
}

function formatCount(n) {
  return n === null || n === undefined ? '—' : n.toLocaleString();
}

function formatDate(dateStr) {
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function relativeDate(dateStr) {
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d)) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 60) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}

function identifyUrl(endpoint) {
  return `${endpoint.pmh_url}?verb=Identify`;
}

function listRecordsUrl(endpoint) {
  let u = `${endpoint.pmh_url}?verb=ListRecords&metadataPrefix=${endpoint.metadata_prefix || 'oai_dc'}`;
  if (endpoint.set) u += `&set=${encodeURIComponent(endpoint.set)}`;
  return u;
}

async function fetchLocations() {
  loadingLocations.value = true;
  try {
    const resp = await api.get('locations', {
      filter: `source_id:${shortId.value}`,
      sort: 'ingested_at:desc',
      'per-page': 1,
      select: 'id,ingested_at',
    });
    locationsCount.value = resp?.meta?.count ?? null;
    lastHarvestedDate.value = resp?.results?.[0]?.ingested_at || null;
  } catch (e) {
    locationsCount.value = null;
    lastHarvestedDate.value = null;
  } finally {
    loadingLocations.value = false;
  }
}

async function fetchWorksCounts() {
  loadingWorksCounts.value = true;
  try {
    const [any, primary] = await Promise.all([
      api.getResultsCount('works', [createSimpleFilter('works', 'locations.source.id', shortId.value)]),
      api.getResultsCount('works', [createSimpleFilter('works', 'primary_location.source.id', shortId.value)]),
    ]);
    worksAnyCount.value = any ?? null;
    worksPrimaryCount.value = primary ?? null;
  } catch (e) {
    worksAnyCount.value = null;
    worksPrimaryCount.value = null;
  } finally {
    loadingWorksCounts.value = false;
  }
}

async function fetchEndpoints() {
  loadingEndpoints.value = true;
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/oaipmh-sets?source_id=${shortId.value}&per_page=200`,
      axiosConfig()
    );
    endpoints.value = (resp.data?.results || []).filter((e) => e.pmh_url);
  } catch (e) {
    endpoints.value = [];
  } finally {
    loadingEndpoints.value = false;
  }
}

function healthLabel(endpoint) {
  const h = endpoint.last_harvest;
  if (!h) return null;
  const parts = [];
  parts.push(h.status === 'success' ? 'last harvest OK' : `last harvest: ${h.status}`);
  if (h.checked_at) parts.push(relativeDate(h.checked_at));
  if (h.record_count !== null && h.record_count !== undefined) {
    parts.push(`${h.record_count.toLocaleString()} records`);
  }
  return parts.join(' · ');
}

watch(shortId, (id) => {
  if (!id) return;
  showAllEndpoints.value = false;
  fetchLocations();
  fetchWorksCounts();
  fetchEndpoints();
}, { immediate: true });
</script>

<style scoped lang="scss">
.harvest-counts {
  border-collapse: collapse;

  td {
    padding: 2px 0;
    vertical-align: baseline;
  }

  .count-cell {
    text-align: right;
    padding-right: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
}

.endpoint-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-of-type {
    border-bottom: none;
  }
}

.endpoint-url {
  word-break: break-all;
}

.health-ok {
  color: #2e7d32;
}

.health-bad {
  color: #c62828;
}

.error-detail {
  margin-left: 16px;
  word-break: break-word;
}
</style>
