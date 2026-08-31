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

    <!-- Harvest history -->
    <div class="text-overline">Harvest history</div>
    <div v-if="loadingHistory" class="my-2">
      <v-skeleton-loader type="image" max-width="680" height="120" />
    </div>
    <template v-else-if="historyBuckets.length">
      <div class="text-body-2 text-medium-emphasis mb-3">
        New records received per month, since our first harvest of this source.
        Early bars can be large — a repository's first harvests include its whole
        back catalog, not just what was new that month.
      </div>
      <div class="history-chart" @pointerleave="hoveredBucket = null">
        <div
          v-if="hoveredBucket !== null"
          class="history-tooltip"
          :class="tooltipEdgeClass"
          :style="{ left: tooltipLeft }"
        >
          <span class="tooltip-value">{{ historyBuckets[hoveredBucket].count.toLocaleString() }}</span>
          <span class="tooltip-label">
            new records · {{ historyBuckets[hoveredBucket].label
            }}<template v-if="hoveredBucket === historyBuckets.length - 1"> (to date)</template>
          </span>
        </div>
        <div class="history-baseline" />
        <div
          v-for="(b, i) in historyBuckets"
          :key="b.key"
          class="history-col"
          tabindex="0"
          :aria-label="`${b.label}: ${b.count.toLocaleString()} new records`"
          @pointerenter="hoveredBucket = i"
          @focus="hoveredBucket = i"
          @blur="hoveredBucket = null"
        >
          <div class="history-bar-slot">
            <div
              v-if="i === maxBucketIndex && hoveredBucket === null"
              class="history-max-label"
            >{{ compactCount(b.count) }}</div>
            <div class="history-bar" :style="{ height: barHeightPx(b.count) }" />
          </div>
          <div class="history-x-label">{{ b.axisLabel }}</div>
        </div>
      </div>
      <div class="text-body-2 mt-2">
        <a href="#" @click.prevent="downloadHistoryCsv">
          <v-icon size="14">mdi-download</v-icon>
          Download as CSV
        </a>
      </div>
      <div v-if="epochExcludedCount" class="text-caption text-medium-emphasis mt-2">
        Excludes {{ epochExcludedCount.toLocaleString() }} records bulk-loaded on
        January 16, 2025, during a storage migration — their original harvest dates
        weren't preserved.
      </div>
      <div v-if="undatedCount" class="text-caption text-medium-emphasis">
        {{ undatedCount.toLocaleString() }} records have no recorded harvest date
        and aren't shown.
      </div>
    </template>
    <div v-else class="text-body-2 text-medium-emphasis">
      No dated harvest records for this source yet.
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
import { exportArrayToCsv } from '@/utils/csvExport';

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

// --- harvest history chart ---
// Runtime histogram over `ingested_at` (real harvest-delivery dates, #911) built
// from N parallel /locations count queries — one per month bucket, 1 credit each.
// `group_by=ingested_at` doesn't exist (DateField has no group_by since
// PROPERTIES 11.0.0), so range-filter counts are the mechanism. Boundary
// semantics verified on prod: `>{prevMonthLastDay}T23:59:59,<{nextMonthFirst}`
// partitions cleanly (adjacent buckets sum exactly to their span).
//
// BULK_LOAD_TS: `ingested_at` = S3 file mtime; a storage migration rewrote a
// large share of files at this exact second (globally — HAL 305K, Zenodo 2.1M,
// Figshare 4.3M rows), so it's a migration artifact, not a real harvest wave.
// We query it exactly, subtract it from its bucket, and disclose the exclusion.
const BULK_LOAD_TS = '2025-01-16T15:52:00';

const loadingHistory = ref(true);
const historyBuckets = ref([]); // {key, label, axisLabel, count}
const epochExcludedCount = ref(0);
const hoveredBucket = ref(null);

const maxBucketCount = computed(() =>
  Math.max(1, ...historyBuckets.value.map((b) => b.count))
);
const maxBucketIndex = computed(() =>
  historyBuckets.value.findIndex((b) => b.count === maxBucketCount.value)
);
const undatedCount = computed(() => {
  if (locationsCount.value === null || !historyBuckets.value.length) return 0;
  const dated =
    historyBuckets.value.reduce((s, b) => s + b.count, 0) + epochExcludedCount.value;
  return Math.max(0, locationsCount.value - dated);
});
const tooltipLeft = computed(() => {
  const n = historyBuckets.value.length;
  if (hoveredBucket.value === null || !n) return '0%';
  return `${((hoveredBucket.value + 0.5) / n) * 100}%`;
});
const tooltipEdgeClass = computed(() => {
  const n = historyBuckets.value.length;
  if (hoveredBucket.value === null || !n) return '';
  const frac = (hoveredBucket.value + 0.5) / n;
  if (frac < 0.2) return 'edge-left';
  if (frac > 0.8) return 'edge-right';
  return '';
});

function barHeightPx(count) {
  if (!count) return '0px';
  return `${Math.max(1, Math.round((count / maxBucketCount.value) * 100))}px`;
}

function compactCount(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

async function countLocationsWhere(extraFilter) {
  const resp = await api.get('locations', {
    filter: `source_id:${shortId.value},${extraFilter}`,
    'per-page': 1,
    select: 'id',
  });
  return resp?.meta?.count ?? 0;
}

// The API rate-limits bursts (429s at ~10 req/s per IP — verified: firing all
// ~24 bucket queries at once gets most of them 429'd). Run them through a small
// worker pool, retrying each query once after a backoff. A second failure
// propagates → the whole chart falls back to its empty state rather than
// rendering a partial histogram whose missing buckets would read as "no harvest".
async function countWithRetry(extraFilter) {
  try {
    return await countLocationsWhere(extraFilter);
  } catch (e) {
    await new Promise((r) => setTimeout(r, 1500));
    return await countLocationsWhere(extraFilter);
  }
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

async function fetchHistory() {
  loadingHistory.value = true;
  historyBuckets.value = [];
  epochExcludedCount.value = 0;
  hoveredBucket.value = null;
  try {
    // Earliest dated location (the >1900 filter excludes ingested_at:null rows).
    const first = await api.get('locations', {
      filter: `source_id:${shortId.value},ingested_at:>1900-01-01`,
      sort: 'ingested_at:asc',
      'per-page': 1,
      select: 'ingested_at',
    });
    const firstDateStr = first?.results?.[0]?.ingested_at;
    if (!firstDateStr) return; // no dated records — section renders its empty state

    const firstDate = new Date(firstDateStr.replace(' ', 'T') + 'Z');
    if (isNaN(firstDate)) return;
    const now = new Date();

    // Month buckets, UTC, from first-harvest month through the current month.
    // Harvesting started 2024-11, so this is ~2 bars/month of horizontal space
    // per year of history for the foreseeable future; revisit granularity if the
    // program is still running in the 2030s.
    const months = [];
    let y = firstDate.getUTCFullYear();
    let m = firstDate.getUTCMonth();
    while (y < now.getUTCFullYear() || (y === now.getUTCFullYear() && m <= now.getUTCMonth())) {
      months.push([y, m]);
      m += 1;
      if (m === 12) { m = 0; y += 1; }
    }
    if (!months.length) return;

    const isoDay = (yy, mm, dd) =>
      `${yy}-${String(mm + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

    const bucketFilters = months.map(([yy, mm]) => {
      const prevEnd = new Date(Date.UTC(yy, mm, 0)); // last day of previous month
      const lower = `${prevEnd.getUTCFullYear()}-${String(prevEnd.getUTCMonth() + 1).padStart(2, '0')}-${String(prevEnd.getUTCDate()).padStart(2, '0')}T23:59:59`;
      const next = new Date(Date.UTC(yy, mm + 1, 1));
      const upper = isoDay(next.getUTCFullYear(), next.getUTCMonth(), 1);
      return `ingested_at:>${lower},ingested_at:<${upper}`;
    });
    const allCounts = await mapPool(
      [...bucketFilters, `ingested_at:${BULK_LOAD_TS}`],
      4,
      countWithRetry
    );
    const epochCount = allCounts[allCounts.length - 1];
    const counts = allCounts.slice(0, -1);

    const epochDate = new Date(BULK_LOAD_TS + 'Z');
    const buckets = months.map(([yy, mm], i) => {
      let count = counts[i];
      if (yy === epochDate.getUTCFullYear() && mm === epochDate.getUTCMonth() && epochCount > 0) {
        count = Math.max(0, count - epochCount);
        epochExcludedCount.value = epochCount;
      }
      return {
        key: isoDay(yy, mm, 1).slice(0, 7), // YYYY-MM
        label: `${MONTH_NAMES[mm]} ${yy}`,
        axisLabel: mm === 0 ? String(yy) : '',
        count,
      };
    });
    // Short spans may contain no January — anchor the axis on the first bucket.
    if (!buckets.some((b) => b.axisLabel)) {
      buckets[0].axisLabel = `${MONTH_NAMES[months[0][1]].slice(0, 3)} ${months[0][0]}`;
    }
    historyBuckets.value = buckets;
  } catch (e) {
    historyBuckets.value = [];
  } finally {
    loadingHistory.value = false;
  }
}

function downloadHistoryCsv() {
  exportArrayToCsv(
    historyBuckets.value.map((b) => ({ month: b.key, new_records: b.count })),
    [
      { key: 'month', label: 'month' },
      { key: 'new_records', label: 'new_records_received' },
    ],
    `openalex-harvest-history-${shortId.value}.csv`
  );
}

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
  fetchHistory();
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

.history-chart {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  max-width: 680px;
  padding-top: 26px; // air for the max label / tooltip
}

.history-baseline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 17px; // just above the x-label band
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
}

.history-col {
  flex: 1 1 0;
  min-width: 3px;
  max-width: 28px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  outline: none;
  cursor: default;
}

.history-bar-slot {
  position: relative;
  height: 100px;
  display: flex;
  align-items: flex-end;
}

.history-bar {
  width: 100%;
  max-width: 24px;
  background: #2563eb;
  border-radius: 4px 4px 0 0; // rounded data-end, square baseline
}

.history-col:hover .history-bar,
.history-col:focus .history-bar {
  background: #3b82f6;
}

.history-max-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
}

.history-x-label {
  height: 17px;
  padding-top: 4px;
  font-size: 11px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.6);
  text-align: left;
  white-space: nowrap;
  overflow: visible;
}

.history-tooltip {
  position: absolute;
  top: -6px;
  transform: translateX(-50%);
  z-index: 2;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 3px 8px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;

  &.edge-left {
    transform: translateX(0);
  }

  &.edge-right {
    transform: translateX(-100%);
  }

  .tooltip-value {
    font-weight: 600;
  }

  .tooltip-label {
    color: rgba(0, 0, 0, 0.6);
    margin-left: 4px;
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
