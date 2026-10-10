<template>
  <div v-if="p" class="pv">
    <div class="pv-count">
      <template v-if="run.count != null">{{ run.count.toLocaleString('en-US') }} results</template>
      <template v-if="p.groups_count"> · {{ p.groups_count.toLocaleString('en-US') }} groups</template>
    </div>
    <table v-if="p.rows && p.rows.length">
      <tr v-for="r in p.rows" :key="r.id || r.name">
        <td class="pv-name">{{ r.name }}</td>
        <td class="pv-num">{{ r.year }}</td>
        <td class="pv-num">{{ r.cited_by != null ? r.cited_by.toLocaleString('en-US') + ' cites' : '' }}</td>
      </tr>
    </table>
    <table v-else-if="groups.length">
      <tr>
        <th></th>
        <th v-for="m in measures" :key="m" class="pv-num">{{ m.replace(/_/g, ' ') }}</th>
      </tr>
      <tr v-for="(g, i) in groups" :key="i" :class="{all: g._all}">
        <td class="pv-name">{{ g.key_display_name }}</td>
        <td v-for="m in measures" :key="m" class="pv-num">{{ fmt(g[m]) }}</td>
      </tr>
    </table>
    <div v-if="p.errors" class="pv-err">{{ typeof p.errors === 'string' ? p.errors : JSON.stringify(p.errors) }}</div>
  </div>
</template>

<script setup>
import {computed} from 'vue';

defineOptions({name: 'PreviewTable'});
const props = defineProps({run: {type: Object, required: true}});

const p = computed(() => props.run.preview);
const measures = computed(() => p.value?.measures || ['count']);
// A calculation with no split answers in summary_all alone; show it as the last row either way.
const groups = computed(() => {
  const g = [...(p.value?.groups || [])];
  if (p.value?.summary_all) g.push({...p.value.summary_all, _all: true});
  return g;
});
const fmt = v => (v == null ? '' : typeof v === 'number'
  ? (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', {maximumFractionDigits: 3})) : String(v));
</script>

<style scoped>
.pv { margin-top: 8px; font-size: 12.5px; overflow-x: auto; }
.pv-count { color: var(--ox-text-muted); margin-bottom: 4px; }
table { width: 100%; border-collapse: collapse; }
td, th { padding: 3px 4px; border-top: 1px solid var(--ox-border-subtle); vertical-align: top; }
th { font-weight: 500; color: var(--ox-text-muted); border-top: 0; text-align: right; }
.pv-name { color: var(--ox-text-secondary); overflow-wrap: break-word; min-width: 9em; }
.pv-num { text-align: right; white-space: nowrap; color: var(--ox-text-tertiary); font-variant-numeric: tabular-nums; }
tr.all td { color: var(--ox-text-muted); font-style: italic; }
.pv-err { color: var(--ox-danger-fg); margin-top: 4px; overflow-wrap: anywhere; }
</style>
