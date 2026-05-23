<template>
  <div
    v-if="hasData"
    ref="chartEl"
    class="entity-counts-chart"
    :aria-label="ariaLabel"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as Plot from '@observablehq/plot';

import { entityConfigs } from '@/entityConfigs';
import { createSimpleFilter, filtersAsUrlStr } from '@/filterConfigs';
import { getShortId } from '@/openalexId';

const props = defineProps({
  // entity payload — must include `counts_by_year` array
  data: { type: Object, required: true },
  // 'authors' | 'institutions' | 'sources' | 'topics' | 'funders' | 'publishers' | 'works'
  type: { type: String, required: true },
});

const router = useRouter();
const chartEl = ref(null);
let chartNode = null;
let resizeObserver = null;

// Tufte palette — match catBlueDark / catOrangeDark from vuetify.js (darken1 weights).
const COLOR_WORKS = '#1E88E5'; // blue.darken1
const COLOR_CITED = '#FB8C00'; // orange.darken1

// Per-type filter key for SERP click targets. For works, we filter the works
// SERP by `cites:W…` (works that cite this work). For every other entity
// type, use entityConfigs[type].filterKey verbatim — same precedent as
// EntityDatumRow.vue (line 62) via url.makeFilterRoute.
function getFilterKey(type) {
  if (type === 'works') return 'cites';
  return entityConfigs[type]?.filterKey || null;
}

// Slice & order: 10 most-recent years in chronological order.
// OpenAlex's counts_by_year ordering varies by entity type (authors come
// back ascending, institutions descending), so sort explicitly before
// slicing the tail.
const counts = computed(() => {
  const raw = props.data?.counts_by_year;
  if (!Array.isArray(raw)) return [];
  return [...raw].sort((a, b) => a.year - b.year).slice(-10);
});

// Compact axis labels for large counts: 1.2k / 3.4M.
function formatCount(v) {
  const n = Math.abs(v);
  if (n >= 1e6) return (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + 'M';
  if (n >= 1e3) return (v / 1e3).toFixed(v % 1e3 === 0 ? 0 : 1) + 'k';
  return String(Math.round(v));
}

const isWorks = computed(() => props.type === 'works');

const hasData = computed(() => counts.value.length >= 2);

const ariaLabel = computed(() => isWorks.value
  ? 'Citations received per year (last 10 years)'
  : 'Works produced and citations received per year (last 10 years)');

function onPointClick(year) {
  const filterKey = getFilterKey(props.type);
  if (!filterKey) return;
  const entityId = getShortId(props.data.id) || props.data.id;
  const entityFilter = createSimpleFilter('works', filterKey, entityId);
  const yearFilter = createSimpleFilter('works', 'publication_year', String(year));
  router.push({
    name: 'Serp',
    params: { entityType: 'works' },
    query: {
      page: 1,
      filter: filtersAsUrlStr([entityFilter, yearFilter]),
    },
  });
}

function onChartClick(e) {
  // Plot attaches the data-array index (a number) on each mark element's
  // __data__. Find the nearest circle in our chart and look up the year
  // via that index in our counts array.
  let tgt = e.target;
  for (let i = 0; i < 3 && tgt; i++) {
    if (tgt.tagName === 'circle' && typeof tgt.__data__ === 'number') {
      const datum = counts.value[tgt.__data__];
      if (datum && datum.year != null) {
        onPointClick(datum.year);
        return;
      }
    }
    tgt = tgt.parentNode;
  }
}

function render() {
  if (!chartEl.value || !hasData.value) return;
  if (chartNode) {
    chartNode.remove();
    chartNode = null;
  }

  const data = counts.value;
  const width = Math.max(180, chartEl.value.clientWidth || 280);
  const height = Math.round(width / 2);

  const years = data.map(d => d.year);

  if (isWorks.value) {
    // Single-line variant (works): cited_by only, single left axis.
    const maxCited = Math.max(1, ...data.map(d => d.cited_by_count || 0));

    chartNode = Plot.plot({
      width,
      height,
      marginLeft: 40,
      marginRight: 8,
      marginTop: 10,
      marginBottom: 22,
      style: { background: 'transparent', fontSize: '11px', overflow: 'visible' },
      x: {
        label: null,
        type: 'point',
        domain: years,
        tickFormat: d => String(d),
      },
      y: {
        label: null,
        grid: false,
        ticks: Math.min(4, maxCited),
        domain: [0, maxCited],
        tickFormat: formatCount,
        color: COLOR_CITED,
      },
      marks: [
        Plot.lineY(data, {
          x: 'year',
          y: 'cited_by_count',
          stroke: COLOR_CITED,
          strokeWidth: 1.5,
          curve: 'monotone-x',
        }),
        Plot.dot(data, {
          x: 'year',
          y: 'cited_by_count',
          fill: COLOR_CITED,
          r: 3,
          tip: true,
          channels: {
            year: 'year',
            citations: 'cited_by_count',
          },
          title: d => `${d.year}: ${d.cited_by_count.toLocaleString()} citations`,
        }),
        // Larger transparent dots for a forgiving click target
        Plot.dot(data, {
          x: 'year',
          y: 'cited_by_count',
          r: 10,
          fill: 'transparent',
          stroke: 'transparent',
          channels: { year: 'year' },
        }),
      ],
    });
  } else {
    // Two-line variant: works_count + cited_by_count, dual y-axis via
    // pre-scaling the second series onto the first scale's domain, then
    // drawing a manual right-axis with an inverse tickFormat.
    const maxWorks = Math.max(1, ...data.map(d => d.works_count || 0));
    const maxCited = Math.max(1, ...data.map(d => d.cited_by_count || 0));
    const scale = maxWorks / maxCited;
    const scaledData = data.map(d => ({
      ...d,
      citedScaled: (d.cited_by_count || 0) * scale,
    }));

    chartNode = Plot.plot({
      width,
      height,
      marginLeft: 40,
      marginRight: 44,
      marginTop: 10,
      marginBottom: 22,
      style: { background: 'transparent', fontSize: '11px', overflow: 'visible' },
      x: {
        label: null,
        type: 'point',
        domain: years,
        tickFormat: d => String(d),
      },
      y: {
        axis: 'left',
        label: null,
        grid: false,
        ticks: Math.min(4, maxWorks),
        domain: [0, maxWorks],
        tickFormat: formatCount,
        color: COLOR_WORKS,
      },
      marks: [
        // works_count
        Plot.lineY(data, {
          x: 'year',
          y: 'works_count',
          stroke: COLOR_WORKS,
          strokeWidth: 1.5,
          curve: 'monotone-x',
        }),
        Plot.dot(data, {
          x: 'year',
          y: 'works_count',
          fill: COLOR_WORKS,
          r: 3,
          tip: true,
          channels: {
            year: 'year',
            works: 'works_count',
          },
          title: d => `${d.year}: ${d.works_count.toLocaleString()} works`,
        }),
        Plot.dot(data, {
          x: 'year',
          y: 'works_count',
          r: 10,
          fill: 'transparent',
          stroke: 'transparent',
          channels: { year: 'year' },
        }),
        // cited_by_count (pre-scaled)
        Plot.lineY(scaledData, {
          x: 'year',
          y: 'citedScaled',
          stroke: COLOR_CITED,
          strokeWidth: 1.5,
          curve: 'monotone-x',
        }),
        Plot.dot(scaledData, {
          x: 'year',
          y: 'citedScaled',
          fill: COLOR_CITED,
          r: 3,
          tip: true,
          channels: {
            year: 'year',
            citations: 'cited_by_count',
          },
          title: d => `${d.year}: ${d.cited_by_count.toLocaleString()} citations`,
        }),
        Plot.dot(scaledData, {
          x: 'year',
          y: 'citedScaled',
          r: 10,
          fill: 'transparent',
          stroke: 'transparent',
          channels: { year: 'year' },
        }),
        // Manual right axis, scaled back to citation counts
        Plot.axisY({
          anchor: 'right',
          color: COLOR_CITED,
          ticks: Math.min(4, maxCited),
          tickFormat: v => formatCount(v / scale),
        }),
      ],
    });
  }

  chartNode.style.cursor = 'pointer';
  chartNode.addEventListener('click', onChartClick);
  chartEl.value.replaceChildren(chartNode);
}

function scheduleRender() {
  nextTick(render);
}

onMounted(() => {
  scheduleRender();
  if (typeof ResizeObserver !== 'undefined' && chartEl.value) {
    resizeObserver = new ResizeObserver(() => scheduleRender());
    resizeObserver.observe(chartEl.value);
  }
});

watch(() => [props.data, props.type], scheduleRender);

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (chartNode) {
    chartNode.removeEventListener('click', onChartClick);
    chartNode.remove();
    chartNode = null;
  }
});
</script>

<style scoped>
.entity-counts-chart {
  width: 100%;
  margin: 0 0 12px;
}
.entity-counts-chart :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  background: transparent;
}
/* Plot draws figure > svg sometimes; ensure no border/background bleeds in. */
.entity-counts-chart :deep(figure) {
  margin: 0;
  background: transparent;
}
</style>
