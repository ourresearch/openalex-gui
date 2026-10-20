<template>
  <div ref="root" class="nl-chart" :class="{ 'nl-chart--busy': busy }">
    <!-- A plain list of works: chart the set from its own group-bys. -->
    <div v-if="isWorksList" class="nl-chart__row" role="radiogroup" aria-label="Chart the works">
      <span class="nl-chart__row-label">Chart these works</span>
      <button
        v-for="v in LIST_VIEWS"
        :key="v.id"
        type="button"
        role="radio"
        class="nl-chart__chip"
        :class="{ 'nl-chart__chip--on': v.id === listView }"
        :aria-checked="v.id === listView"
        @click="listView = v.id"
      >{{ v.label }}</button>
    </div>

    <div v-if="choices.length > 1" class="nl-chart__row" role="radiogroup" aria-label="Chart type">
      <button
        v-for="(t, i) in choices"
        :key="t"
        type="button"
        role="radio"
        class="nl-chart__chip"
        :class="{ 'nl-chart__chip--on': t === type }"
        :aria-checked="t === type"
        :title="i === 0 ? 'Suggested for this answer' : ''"
        @click="type = t"
      >
        <i :class="['mdi', CHART_INFO[t].icon]" aria-hidden="true"></i>
        {{ CHART_INFO[t].label }}
        <span v-if="i === 0" class="nl-chart__suggested">suggested</span>
      </button>
    </div>

    <div v-if="measureChoices.length > 1" class="nl-chart__row" role="radiogroup" aria-label="Measure">
      <span class="nl-chart__row-label">{{ type === CHART.SCATTER ? "Up the side" : "Show" }}</span>
      <button
        v-for="m in measureChoices"
        :key="m.key"
        type="button"
        role="radio"
        class="nl-chart__chip"
        :class="{ 'nl-chart__chip--on': m.key === measureKey }"
        :aria-checked="m.key === measureKey"
        @click="measureKey = m.key"
      >{{ m.label }}</button>
    </div>

    <div v-if="title" class="nl-chart__head">
      <div class="nl-chart__title">{{ title }}</div>
      <div v-if="note" class="nl-chart__note">{{ note }}</div>
    </div>

    <div v-if="type === CHART.NUMBER && tiles.length" class="nl-chart__tiles">
      <div v-for="(t, i) in tiles" :key="t.key" class="nl-chart__tile" :class="{ 'nl-chart__tile--hero': i === 0 }">
        <div class="nl-chart__tile-value">{{ t.value }}</div>
        <div class="nl-chart__tile-label">{{ t.label }}</div>
      </div>
    </div>
    <div v-show="type && type !== CHART.NUMBER" ref="plotEl" class="nl-chart__plot"></div>

    <div v-if="message" class="nl-chart__empty">{{ message }}</div>
  </div>
</template>

<script setup>
// The Visualization format of the one-mode search page (oxjob #1745; page #1744 mounts it).
// Props: the OQL the page shows and the API's response to it. Picks the best chart for the
// answer's shape (pickChart.js), offers the others that fit, and a measure picker when the
// answer has several. Plot and the map load only when a chart is drawn.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, nextTick } from "vue";
import { chartData, plural, capitalize } from "./chartData";
import { CHART, CHART_INFO, chartOptions, defaultMeasure, knownCount } from "./pickChart";
import { formatValue } from "./chartStyle";

const props = defineProps({
  oql: { type: String, default: "" },
  resultsObject: { type: Object, default: null },
});

// Group-bys offered for a plain list of works (each one API call, priced like the list).
const LIST_VIEWS = [
  { id: "year", label: "By year", column: "publication_year" },
  { id: "oa", label: "By open access", column: "open_access.oa_status" },
  { id: "country", label: "By country", column: "authorships.countries" },
  { id: "type", label: "By type", column: "type" },
  { id: "institution", label: "Top institutions", column: "authorships.institutions.lineage" },
  { id: "topic", label: "Top topics", column: "primary_topic.id" },
];

const root = ref(null);
const plotEl = ref(null);
const width = ref(0);
const busy = ref(false);
const message = ref("");
const listView = ref("year");
const listResponse = shallowRef(null);
const type = ref(null);
const measureKey = ref(null);
const title = ref("");
const note = ref("");

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch (e) {
    console.warn("[NlResultChart]", e);
    return fallback;
  }
};

const baseData = computed(() => safe(() => chartData(props.resultsObject), null));
const isWorksList = computed(() => baseData.value?.kind === "list" && baseData.value.rowsEntity === "works" && Boolean(baseData.value.oqo?.get_rows));
const data = computed(() => (isWorksList.value ? safe(() => (listResponse.value ? chartData(listResponse.value) : null), null) : baseData.value));
const choices = computed(() => safe(() => (data.value ? chartOptions(data.value, measureKey.value) : []), []));
const measureChoices = computed(() => (type.value === CHART.NUMBER ? [] : data.value?.measures || []));

// A new answer: open on its suggested chart and measure.
watch(
  data,
  (d) => {
    measureKey.value = d ? defaultMeasure(d)?.key || null : null;
    type.value = choices.value[0] || null;
  },
  { immediate: true },
);
// A measure that can't stack (a mean) drops the stacked charts: fall back to the first that fits.
watch(choices, (c) => {
  if (!c.includes(type.value)) type.value = c[0] || null;
});

// Big-number tiles: the whole set, or the one group a comparison returned.
const tiles = computed(() => {
  const d = data.value;
  if (!d || type.value !== CHART.NUMBER) return [];
  const one = d.kind === "groups" ? d.rows.find((r) => !r.path[0].unknown) : null;
  const values = one ? one.values : d.whole;
  const ms = [...d.measures].sort((a, b) => (a.key === measureKey.value ? -1 : b.key === measureKey.value ? 1 : 0));
  const noun = (d.rowsEntity || "works").replace(/s$/, "");
  return ms
    .filter((m) => typeof values?.[m.key] === "number")
    .map((m) => ({
      key: m.key,
      value: formatValue(m, values[m.key]),
      label: m.measure === "count" ? capitalize(plural(noun, values[m.key])) : m.label,
    }));
});

// ---- the plain-list views -----------------------------------------------------------------

async function loadListView() {
  const d = baseData.value;
  const view = LIST_VIEWS.find((v) => v.id === listView.value);
  if (!isWorksList.value || !view || typeof window === "undefined") return; // never during server render
  const { calculate, sort_by, group_by, sample, seed, ...rows } = d.oqo; // eslint-disable-line no-unused-vars
  const oqo = { ...rows, group_by: [{ column_id: view.column }] };
  busy.value = true;
  message.value = "";
  try {
    const { api } = await import("@/api");
    const resp = await api.executeOqo(oqo, { per_page: 200 });
    // The charts read the split from the echoed query; keep ours if the echo is missing.
    if (resp?.meta && !resp.meta.x_query?.oqo) resp.meta.x_query = { ...(resp.meta.x_query || {}), oqo };
    listResponse.value = resp;
  } catch (e) {
    console.warn("[NlResultChart] list view", e);
    message.value = "This chart couldn't load. Try another view, or the Table.";
  } finally {
    busy.value = false;
  }
}
watch([isWorksList, listView, () => props.resultsObject], () => {
  listResponse.value = null;
  loadListView();
}, { immediate: true });

// ---- drawing ------------------------------------------------------------------------------

let PlotModule = null;
let drawSeq = 0;

async function draw() {
  const seq = ++drawSeq;
  const el = plotEl.value;
  const d = data.value;
  if (!el) return;
  if (!d || !type.value) {
    el.replaceChildren();
    title.value = "";
    note.value = "";
    if (!busy.value && !isWorksList.value) message.value = emptyMessage(d);
    return;
  }
  message.value = "";
  if (type.value === CHART.NUMBER) {
    el.replaceChildren();
    const one = d.kind === "groups" ? d.rows.find((r) => !r.path[0].unknown) : null;
    title.value = one ? one.path[0].name : "";
    note.value = "";
    return;
  }
  try {
    if (!PlotModule) PlotModule = await import("@observablehq/plot");
    let world = null;
    if (type.value === CHART.MAP) world = await (await import("./worldMap")).loadWorld();
    const { renderChart } = await import("./renderChart");
    if (seq !== drawSeq) return; // a newer draw started while this one loaded
    const out = renderChart(PlotModule, { data: d, type: type.value, measureKey: measureKey.value, width: width.value || el.clientWidth || 640, world });
    if (!out?.node) throw new Error(`no chart for ${type.value}`);
    el.replaceChildren(out.node);
    title.value = out.title;
    note.value = out.note;
  } catch (e) {
    if (seq !== drawSeq) return;
    console.warn("[NlResultChart] draw", e);
    el.replaceChildren();
    message.value = "This chart couldn't be drawn. Try another chart type, or the Table.";
  }
}

function emptyMessage(d) {
  if (!d) return "";
  if (d.kind === "list") return "Charts draw counts and calculations. Ask for a breakdown, a ranking or a trend, for example “how many of these per year?”";
  if (d.dims?.length > 2) return "Three splits read best as a table: see the Table tab.";
  if (d.kind === "groups" && !knownCount(d)) return "No groups to chart.";
  return "No chart fits this answer: see the Table tab.";
}

let frame = 0;
const scheduleDraw = () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => draw());
};
watch([data, type, measureKey, width], () => nextTick(scheduleDraw));

// For a parent that wants to open a given chart (the preview, tests); the page needn't use it.
defineExpose({
  setType: (t) => {
    if (choices.value.includes(t)) type.value = t;
  },
  setMeasure: (k) => {
    if (data.value?.measures.some((m) => m.key === k)) measureKey.value = k;
  },
});

let observer = null;
onMounted(() => {
  width.value = root.value?.clientWidth || 0;
  observer = new ResizeObserver((entries) => {
    const w = Math.round(entries[0].contentRect.width);
    if (Math.abs(w - width.value) >= 8) width.value = w;
  });
  observer.observe(root.value);
  scheduleDraw();
});
onBeforeUnmount(() => {
  observer?.disconnect();
  cancelAnimationFrame(frame);
  drawSeq++;
});
</script>

<style scoped>
.nl-chart {
  width: 100%;
  min-height: 120px;
  color: #0b0b0b;
  transition: opacity 0.15s;
}
.nl-chart--busy {
  opacity: 0.45;
}
.nl-chart__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.nl-chart__row-label {
  font-size: 12px;
  color: #52514e;
  margin-right: 2px;
}
.nl-chart__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #e1e0d9;
  border-radius: 14px;
  background: #fff;
  color: #52514e;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.nl-chart__chip:hover {
  background: #f7f7f5;
}
.nl-chart__chip:focus-visible {
  outline: 2px solid #2a78d6;
  outline-offset: 1px;
}
.nl-chart__chip--on {
  border-color: #0b0b0b;
  color: #0b0b0b;
  font-weight: 600;
}
.nl-chart__chip .mdi {
  font-size: 16px;
}
.nl-chart__suggested {
  font-size: 11px;
  font-weight: 400;
  color: #898781;
}
.nl-chart__head {
  margin: 14px 0 6px;
}
.nl-chart__title {
  font-size: 15px;
  font-weight: 600;
  color: #0b0b0b;
}
.nl-chart__note {
  font-size: 12px;
  color: #52514e;
  margin-top: 2px;
}
.nl-chart__plot {
  width: 100%;
}
.nl-chart__plot :deep(svg) {
  display: block;
  max-width: 100%;
  height: auto;
}
.nl-chart__plot :deep(figure) {
  margin: 0;
}
.nl-chart__plot :deep(.nl-chart-shares) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  font-size: 13px;
}
.nl-chart__plot :deep(.nl-chart-shares__item) {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  max-width: 460px;
}
.nl-chart__plot :deep(.nl-chart-shares__swatch) {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.nl-chart__plot :deep(.nl-chart-shares__name) {
  color: #0b0b0b;
}
.nl-chart__plot :deep(.nl-chart-shares__count) {
  color: #898781;
  font-variant-numeric: tabular-nums;
  min-width: 72px;
  text-align: right;
}
.nl-chart__plot :deep(.nl-chart-shares__item strong) {
  font-variant-numeric: tabular-nums;
  min-width: 48px;
  text-align: right;
}
.nl-chart__tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  align-items: flex-end;
  padding: 24px 0 12px;
}
.nl-chart__tile-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.1;
  color: #0b0b0b;
}
.nl-chart__tile--hero .nl-chart__tile-value {
  font-size: 56px;
}
.nl-chart__tile-label {
  font-size: 14px;
  color: #52514e;
  margin-top: 4px;
}
.nl-chart__empty {
  padding: 32px 0;
  color: #52514e;
  font-size: 14px;
}
</style>
