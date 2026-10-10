<template>
  <static-page :title="need ? need.name : ''" class="qm">
    <template #eyebrow>
      <static-breadcrumbs v-if="need" :crumbs="crumbs" />
    </template>
    <template #intro>{{ need ? need.job : '' }}</template>

    <div v-if="error" class="qm-msg">{{ error }}</div>
    <div v-else-if="!data" class="qm-msg">Loading…</div>
    <div v-else-if="!need" class="qm-msg">No need called “{{ needId }}”. <router-link :to="{name: 'QuestionMap'}">Back to the map</router-link></div>

    <template v-else>
      <dl class="facts">
        <div v-if="need.askers?.length"><dt>Who asks</dt><dd>{{ need.askers.join(', ') }}</dd></div>
        <div v-if="need.tools_today?.length"><dt>What they use today</dt><dd>{{ need.tools_today.join(', ') }}</dd></div>
        <div v-if="need.answer_shape"><dt>Answer shape</dt><dd>{{ need.answer_shape }}</dd></div>
        <div v-if="need.in_scope !== true && need.in_scope"><dt>Scope</dt><dd>{{ need.in_scope }}</dd></div>
      </dl>

      <section class="tiles">
        <div class="tile"><div class="tile-n">{{ stats.n }}</div><div class="tile-l">questions</div></div>
        <div class="tile"><div class="tile-n">{{ stats.real || '–' }}</div><div class="tile-l">from real users</div></div>
        <div class="tile"><div class="tile-n">{{ stats.own || '–' }}</div><div class="tile-l">in the source's own words</div></div>
        <div class="tile"><div class="tile-n">{{ pct(stats.oneQuery) }}</div><div class="tile-l">one OQL query answers it today</div></div>
        <div v-for="a in data.arms" :key="a.key" class="tile">
          <div class="tile-n">{{ pct(stats.arms[a.key].share) }}</div>
          <div class="tile-l">{{ a.name }} right ({{ stats.arms[a.key].right }} of {{ stats.arms[a.key].tested }})</div>
        </div>
        <div class="tile"><div class="tile-n">{{ num(askers(need)) }}</div><div class="tile-l">website users and API keys a week (logs)</div></div>
        <div class="tile"><div class="tile-n">{{ num(need.prevalence?.zendesk_tickets) }}</div><div class="tile-l">support tickets</div></div>
      </section>

      <section class="qm-section">
        <h2>How hard</h2>
        <rung-bar :counts="stats.rungs" :rungs="data.rungs" :height="18" />
        <rung-legend :rungs="data.rungs" :counts="stats.rungs" />
        <div v-if="gapList.length">
          <h3>What stands in the way</h3>
          <div v-for="g in gapList" :key="g.code" class="gap-row">
            <span>{{ data.gaps[g.code] || g.code }}</span>
            <v-progress-linear :model-value="100 * g.n / gapList[0].n" height="8" rounded color="grey-darken-2"
                               bg-color="grey-lighten-3" :aria-label="`${data.gaps[g.code] || g.code}: ${g.n}`" />
            <span class="num">{{ g.n }}</span>
          </div>
        </div>
      </section>

      <section v-if="pins.success || pins.failure" class="qm-section">
        <h2>One success, one failure</h2>
        <p class="qm-body">Real users' questions first where there are any. Model answers are the launch configuration's.</p>
        <div v-if="pins.success" class="pin"><div class="pin-label good">{{ data.launch.name }} gets it right</div>
          <question-row :q="pins.success" :data="data" start-open /></div>
        <div v-if="pins.failure" class="pin"><div class="pin-label bad">{{ data.launch.name }} gets it wrong</div>
          <question-row :q="pins.failure" :data="data" start-open /></div>
      </section>

      <section class="qm-section">
        <div class="list-head">
          <h2>Every question</h2>
          <div class="chips">
            <button v-for="l in data.labels" :key="l.key" type="button" class="chip" :class="{on: labels.has(l.key)}"
                    :disabled="!allLabels[l.key]" @click="labels = toggled(labels, l.key)">
              {{ l.name }} <span class="chip-n">{{ allLabels[l.key] || 0 }}</span>
            </button>
          </div>
        </div>
        <p class="qm-body">Easiest first. ✓ right, ◐ partly, ✕ wrong, – not run; the marks are {{ data.arms.map(a => a.name).join(', ') }}.
          “Model-written” means a model wrote the question; open it to see the evidence it came from.</p>
        <template v-for="g in byRung" :key="g.key">
          <div class="lg">
            <span v-if="g.rung" class="swatch" :style="{background: RUNG_COLORS[g.rung.n]}" />
            <b>{{ g.rung ? g.rung.name : 'Not rated yet' }}</b>
            <span class="lg-n">{{ g.qs.length }}</span>
          </div>
          <question-row v-for="q in g.qs" :key="q.id" :q="q" :data="data" />
        </template>
      </section>

      <section v-if="need.importance" class="qm-section">
        <h2>Evidence</h2>
        <p class="qm-body">{{ need.importance }}</p>
        <p v-if="need.see_also?.length" class="qm-body">See also:
          <template v-for="(s, i) in need.see_also" :key="s">
            <router-link v-if="data.needs[s]" :to="{name: 'QuestionMapNeed', params: {need: s}, query: $route.query}">{{ data.needs[s].name }}</router-link>
            <span v-else>{{ s }}</span><span v-if="i < need.see_also.length - 1">, </span>
          </template>
        </p>
      </section>
    </template>
  </static-page>
</template>

<script setup>
import {computed, onMounted, shallowRef, watch} from 'vue';
import {useRoute} from 'vue-router';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticBreadcrumbs from '@/components/StaticPage/StaticBreadcrumbs.vue';
import RungBar from '@/components/QuestionMap/RungBar.vue';
import RungLegend from '@/components/QuestionMap/RungLegend.vue';
import QuestionRow from '@/components/QuestionMap/QuestionRow.vue';
import '@/components/QuestionMap/questionMap.css';
import {RUNG_COLORS, askers, countBy, labelsFromQuery, loadQuestionMap, num, pct, pinned, statsFor, toggled} from '@/questionMap';

defineOptions({name: 'QuestionMapNeed'});

const route = useRoute();
const data = shallowRef(null);
const error = shallowRef(null);
const labels = shallowRef(new Set());

const needId = computed(() => route.params.need);
const need = computed(() => data.value?.needs[needId.value]);
const crumbs = computed(() => [
  {label: 'The question map', to: {name: 'QuestionMap', query: route.query}},
  {label: data.value.branchById[need.value.branch]?.name},
  ...(need.value.node ? [{label: data.value.nodeById[need.value.node].name}] : []),
]);

onMounted(async () => {
  try {
    data.value = await loadQuestionMap();
    labels.value = labelsFromQuery(route.query, data.value.labels);
  } catch (e) {
    error.value = e.message;
  }
});
watch(needId, () => { if (data.value) labels.value = labelsFromQuery(route.query, data.value.labels); });

const all = computed(() => data.value?.byNeed[needId.value] || []);
const shown = computed(() => all.value.filter(q => labels.value.has(q.label)));
const allLabels = computed(() => countBy(all.value, 'label'));
const stats = computed(() => statsFor(shown.value, data.value.arms));
const pins = computed(() => pinned(shown.value, data.value.launch.key));
const gapList = computed(() => Object.entries(stats.value.gaps).map(([code, n]) => ({code, n})).sort((a, b) => b.n - a.n));
// Questions grouped by rung, easiest first; unrated last.
const byRung = computed(() => {
  const g = {};
  for (const q of shown.value) (g[q.rung || 'none'] ||= []).push(q);
  return [...data.value.rungs.map(r => ({key: r.n, rung: r, qs: g[r.n]})), {key: 'none', rung: null, qs: g.none}]
    .filter(x => x.qs);
});
</script>

<style scoped>
.facts { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px 24px; }
.facts dt { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ox-text-muted); }
.facts dd { margin: 2px 0 0; font-size: 14px; color: var(--ox-text-secondary); line-height: 1.5; }
.qm .tiles { max-width: 1000px; grid-template-columns: repeat(4, 1fr); }
.qm-section { max-width: 1000px; }
h3 { font-size: 15px; font-weight: 600; margin: 20px 0 8px; }
.gap-row { display: grid; grid-template-columns: minmax(200px, 340px) 1fr 40px; gap: 12px; align-items: center; font-size: 14px; padding: 3px 0; }
.pin { border: 1px solid var(--ox-border-default); border-radius: 12px; padding: 8px 12px 0; margin-bottom: 14px; }
.pin-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin: 4px 4px 0; }
.pin-label.good { color: var(--ox-success-fg); }
.pin-label.bad { color: var(--ox-danger-fg); }
.pin :deep(.q:first-of-type) { border-top: 0; }
.list-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; }
.list-head .chip { font-size: 12.5px; padding: 3px 10px; }
@media (max-width: 760px) {
  .qm .tiles { grid-template-columns: repeat(2, 1fr); }
  .gap-row { grid-template-columns: 1fr 60px 32px; }
}
</style>
