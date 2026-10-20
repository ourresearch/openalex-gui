<template>
  <!-- The List format of a calculation (oxjob #1744): one ranked line per group, its first
       number drawn as a bar so the order reads at a glance. Table shows every column. -->
  <ol class="nl-group-list">
    <li v-for="(row, i) in rows" :key="row.id" class="nl-group">
      <span v-if="!byYear" class="nl-group-rank">{{ i + 1 }}</span>
      <div class="nl-group-main">
        <div class="nl-group-name">
          <template v-for="(g, j) in row.path" :key="j">
            <span v-if="j" class="nl-group-sep"> · </span>
            <router-link v-if="groupLink(g.key)" :to="groupLink(g.key)">{{ label(g) }}</router-link>
            <span v-else>{{ label(g) }}</span>
          </template>
          <span v-if="!row.path.length">{{ wholeLabel }}</span>
        </div>
        <div v-if="lead" class="nl-group-bar-wrap">
          <div class="nl-group-bar" :style="{ width: barWidth(row) }" />
        </div>
      </div>
      <div class="nl-group-values">
        <div v-for="m in shownMeasures" :key="m.key" class="nl-group-value">
          <span class="nl-group-num">{{ formatMeasure(m, row.group[m.key]) }}</span>
          <span v-if="shownMeasures.length > 1" class="nl-group-unit">{{ m.oql }}</span>
        </div>
      </div>
    </li>
    <li v-if="!rows.length" class="nl-group-empty">No groups.</li>
  </ol>
</template>

<script setup>
import { computed } from 'vue';
import { flatRows, formatMeasure, groupLink, wholeSetMeasures, isTextMeasure } from '@/oqlPipeline';

defineOptions({ name: 'NlGroupList' });

const props = defineProps({
  resultsObject: { type: Object, required: true },
});

const meta = computed(() => props.resultsObject?.meta || {});
const depth = computed(() => (meta.value.splits || []).length);
const measures = computed(() => (depth.value ? meta.value.measures || [] : wholeSetMeasures(meta.value.measures)));
const YEAR = /^(1[5-9]|20)\d\d$/;
const rows = computed(() => {
  if (!depth.value) {
    const all = props.resultsObject?.summary?.all;
    return all ? [{ id: 'all', path: [], group: all }] : [];
  }
  const out = flatRows(props.resultsObject?.group_by, depth.value);
  // A breakdown by year reads in year order, not by size (the API ranks groups by count).
  if (depth.value === 1 && out.length > 1 && out.every((r) => YEAR.test(String(r.path[0]?.key)))) {
    return [...out].sort((a, b) => Number(a.path[0].key) - Number(b.path[0].key));
  }
  return out;
});
const byYear = computed(() => depth.value === 1 && rows.value.length > 1
  && rows.value.every((r) => YEAR.test(String(r.path[0]?.key))));
const shownMeasures = computed(() => measures.value.slice(0, 3));
// The bar follows the first numeric measure.
const lead = computed(() => measures.value.find((m) => !isTextMeasure(m, rows.value)) || null);
const maxLead = computed(() => {
  if (!lead.value) return 0;
  return Math.max(0, ...rows.value.map((r) => Number(r.group[lead.value.key]) || 0));
});
const wholeLabel = computed(() => props.resultsObject?.summary?.all?.key_display_name || 'All');

// The current year is partial; say so, as the chart does ("so far").
const THIS_YEAR = String(new Date().getFullYear());
function label(g) {
  const name = g.key_display_name ?? String(g.key);
  return byYear.value && String(g.key) === THIS_YEAR ? `${name} (so far)` : name;
}
function barWidth(row) {
  const v = Number(row.group[lead.value.key]) || 0;
  if (!maxLead.value || v <= 0) return '0%';
  return `${Math.max(1, (v / maxLead.value) * 100)}%`;
}
</script>

<style scoped>
.nl-group-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}
.nl-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.nl-group-rank {
  flex: 0 0 28px;
  text-align: right;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  font-variant-numeric: tabular-nums;
}
.nl-group-main {
  flex: 1 1 auto;
  min-width: 0;
}
.nl-group-name {
  font-size: 14.5px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nl-group-sep {
  color: rgba(0, 0, 0, 0.35);
}
.nl-group-bar-wrap {
  margin-top: 4px;
  height: 6px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.04);
}
.nl-group-bar {
  height: 100%;
  border-radius: 3px;
  background: rgba(var(--v-theme-primary), 0.55);
}
.nl-group-values {
  flex: 0 0 auto;
  display: flex;
  gap: 16px;
  text-align: right;
}
.nl-group-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 64px;
}
.nl-group-num {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: rgba(0, 0, 0, 0.87);
}
.nl-group-unit {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
}
.nl-group-empty {
  padding: 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
}
</style>
