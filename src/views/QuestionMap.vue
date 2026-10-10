<template>
  <static-page title="The question map" class="qm">
    <template #eyebrow><span class="qm-eyebrow">Natural language · Staff only</span></template>
    <template #intro>
      Every question we want OQL and the chat agent to answer, grouped by the need behind it and ordered from easiest to
      hardest. The needs come from the map of what people use the literature for; the questions from real users, our
      logs, Kyle's work and published sources, with synthetic ones labelled.
    </template>

    <div v-if="error" class="qm-msg">{{ error }}</div>
    <div v-else-if="!data" class="qm-msg">Loading the map…</div>

    <template v-else>
      <div class="qm-controls">
        <div class="chips" role="group" aria-label="Sources">
          <span class="ctl-label">Sources</span>
          <button v-for="l in data.labels" :key="l.key" type="button" class="chip" :class="{on: labels.has(l.key)}"
                  :title="l.story" @click="labels = toggled(labels, l.key)">
            {{ l.name }} <span class="chip-n">{{ labelCounts[l.key] || 0 }}</span>
          </button>
          <button type="button" class="chip quiet" @click="labels = new Set(['real'])">Real users only</button>
          <button v-if="labels.size !== data.labels.length" type="button" class="chip quiet"
                  @click="labels = new Set(data.labels.map(l => l.key))">All</button>
        </div>
        <div class="chips" role="group" aria-label="Wording">
          <span class="ctl-label">Wording</span>
          <button type="button" class="chip" :class="{on: !wording}" @click="wording = null">All</button>
          <button v-for="w in data.wordings" :key="w.key" type="button" class="chip" :class="{on: wording === w.key}"
                  :title="w.story" @click="wording = wording === w.key ? null : w.key">{{ w.name }}</button>
        </div>
        <div class="chips" role="group" aria-label="Branch">
          <span class="ctl-label">Branch</span>
          <button type="button" class="chip" :class="{on: !branch}" @click="branch = null">All</button>
          <button v-for="b in data.branches" :key="b.id" type="button" class="chip" :class="{on: branch === b.id}"
                  @click="branch = branch === b.id ? null : b.id">{{ b.name }}</button>
        </div>
        <input v-model="searchInput" class="qm-search" type="search" placeholder="Find a question…" aria-label="Find a question">
      </div>

      <section class="tiles">
        <div class="tile"><div class="tile-n">{{ rows.length }}</div><div class="tile-l">needs</div></div>
        <div class="tile"><div class="tile-n">{{ num(total.n) }}</div><div class="tile-l">questions</div></div>
        <div class="tile"><div class="tile-n">{{ pct(total.n ? total.real / total.n : null) }}</div><div class="tile-l">from real users</div></div>
        <div class="tile"><div class="tile-n">{{ pct(total.n ? total.own / total.n : null) }}</div><div class="tile-l">in the source's own words</div></div>
        <div class="tile"><div class="tile-n">{{ pct(total.oneQuery) }}</div><div class="tile-l">one OQL query answers it today</div></div>
        <div class="tile"><div class="tile-n">{{ pct(total.arms[data.launch.key].share) }}</div>
          <div class="tile-l">{{ data.launch.name }}, the launch agent, gets right</div></div>
      </section>

      <section v-if="data.summary?.length" class="qm-section">
        <h2>What the map says</h2>
        <ol class="says-list">
          <li v-for="(x, i) in data.summary" :key="i"><b>{{ x.headline }}</b> {{ x.body }}</li>
        </ol>
        <p class="says-note">Read from every source, as of {{ data.meta.built }}; the filters above don't change it.</p>
      </section>

      <section class="qm-section">
        <h2>The shape</h2>
        <p class="qm-body">How hard each branch's questions are, on five rungs. The light blue is what works today.</p>
        <rung-legend :rungs="data.rungs" />
        <div class="shape">
          <div v-for="b in branchStats" :key="b.branch.id" class="shape-row">
            <div class="shape-name">{{ b.branch.name }}</div>
            <rung-bar :counts="b.stats.rungs" :rungs="data.rungs" :height="18" />
            <div class="shape-n">{{ num(b.stats.n) }}</div>
            <div class="shape-n">{{ pct(b.stats.oneQuery) }} one query</div>
          </div>
        </div>
      </section>

      <section class="qm-section">
        <div class="ladder-head">
          <h2>Every need, {{ SORTS[sortKey] }}</h2>
          <label class="sort">Sort
            <select v-model="sortKey">
              <option v-for="(n, k) in SORTS" :key="k" :value="k">{{ n }}</option>
            </select>
          </label>
        </div>
        <p class="qm-body">Each row is one need: what someone is trying to get done. Click it for its questions and every model's answers.</p>
        <div class="ladder" role="table">
          <div class="lr lh" role="row">
            <div role="columnheader">Need</div>
            <div role="columnheader">Difficulty</div>
            <div role="columnheader" class="num" title="Share of its questions one OQL query answers today (rungs 1 and 2)">One query</div>
            <div v-for="a in data.arms" :key="a.key" role="columnheader" class="num" :title="`${a.story}: share of data questions judged right`">{{ a.name }}</div>
            <div role="columnheader" class="num">Questions</div>
            <div role="columnheader" class="num" title="Questions from real users">Real</div>
            <div role="columnheader" class="num" :title="`Distinct website users plus API keys a week on this need's logged query shapes: ${data.meta.logs}`">Logged a week</div>
          </div>
          <template v-for="g in groups" :key="g.key">
            <div v-if="g.rung" class="lg" role="row">
              <span class="swatch" :style="{background: RUNG_COLORS[g.rung.n]}" />
              <b>{{ g.rung.n }} · {{ g.rung.name }}</b>
              <span class="lg-story">{{ g.rung.story }}</span>
              <span class="lg-n">{{ g.rows.length }} needs</span>
            </div>
            <router-link v-for="r in g.rows" :key="r.need.id" class="lr" role="row"
                         :to="{name: 'QuestionMapNeed', params: {need: r.need.id}, query: linkQuery}">
              <div>
                <div class="need-name">{{ r.need.name }}</div>
                <div class="need-job">{{ r.need.job }}</div>
                <div class="need-branch">{{ r.branch.name }} · {{ r.node.name }}</div>
              </div>
              <rung-bar :counts="r.stats.rungs" :rungs="data.rungs" />
              <div class="num strong">{{ pct(r.stats.oneQuery) }}</div>
              <div v-for="a in data.arms" :key="a.key" class="num" :class="{dim: r.stats.arms[a.key].tested < 3}"
                   :title="`${r.stats.arms[a.key].right} of ${r.stats.arms[a.key].tested} right`">{{ pct(r.stats.arms[a.key].share) }}</div>
              <div class="num">{{ r.stats.n }}</div>
              <div class="num">{{ r.stats.real || '–' }}</div>
              <div class="num">{{ num(askers(r.need)) }}</div>
            </router-link>
          </template>
        </div>
      </section>

      <section class="qm-section">
        <h2>How we know</h2>
        <table class="how">
          <tr v-for="l in data.labels" :key="l.key">
            <td class="how-name">{{ l.name }}</td>
            <td class="num">{{ num(allCounts[l.key]) }}</td>
            <td class="how-story">{{ l.story }}</td>
          </tr>
        </table>
        <ul class="notes">
          <li><b>Needs</b> are the {{ inScopeNeeds }} in-scope leaves of the map of what people use the literature for (#1602).</li>
          <li><b>Wording.</b> {{ data.wordings.map(w => `${w.name}: ${w.story}`).join(' ') }}</li>
          <li><b>Rungs.</b> {{ data.rungs.map(r => `${r.n}: ${r.name}`).join('; ') }}. Rungs 3 to 5 come from #1555's grading of
            OQL against every map question; rungs 1 and 2 from the launch agent's answer.</li>
          <li><b>Models</b> answer as the chat panel would: {{ data.meta.configuration }}. {{ data.arms.map(a => a.story).join('; ') }}.
            Judged by {{ data.meta.judge }}. Models are graded on data questions only.</li>
          <li><b>Logged a week</b>: {{ data.meta.logs }}. Only the most common query shapes were sampled, so a dash means
            "not among them", not "never asked".</li>
          <li><b>#1494's held-back test questions</b> are not on this page; they are run once, at the end.</li>
          <li>Built {{ data.meta.built }} by oxjob #1618.</li>
        </ul>
      </section>
    </template>
  </static-page>
</template>

<script setup>
import {computed, onMounted, shallowRef, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import RungBar from '@/components/QuestionMap/RungBar.vue';
import RungLegend from '@/components/QuestionMap/RungLegend.vue';
import '@/components/QuestionMap/questionMap.css';
import {RUNG_COLORS, SORTS, askers, countBy, groupBy, labelsFromQuery, loadQuestionMap, matches, needRows, num, pct,
  sortRows, statsFor, toggled} from '@/questionMap';

defineOptions({name: 'QuestionMap'});

const route = useRoute();
const router = useRouter();
const data = shallowRef(null);
const error = shallowRef(null);

// Filters live in the URL so a link (or the back button) keeps them.
const labels = shallowRef(new Set());
const wording = shallowRef(null);
const branch = shallowRef(route.query.branch || null);
const searchInput = shallowRef(route.query.q || '');
const search = shallowRef(searchInput.value);
const sortKey = shallowRef(SORTS[route.query.sort] ? route.query.sort : 'ease');

let typing;
watch(searchInput, v => {   // the box answers at once; the page catches up 150 ms after the last keystroke
  clearTimeout(typing);
  typing = setTimeout(() => { search.value = v; }, 150);
});

onMounted(async () => {
  try {
    data.value = await loadQuestionMap();
    labels.value = labelsFromQuery(route.query, data.value.labels);
    if (data.value.wordings.some(w => w.key === route.query.wording)) wording.value = route.query.wording;
  } catch (e) {
    error.value = e.message;
  }
});

const linkQuery = computed(() => {
  const q = {};
  if (data.value && labels.value.size !== data.value.labels.length) q.sources = [...labels.value].join(',');
  if (wording.value) q.wording = wording.value;
  return q;
});
watch([labels, wording, branch, search, sortKey], () => {
  router.replace({query: {...linkQuery.value, ...(branch.value ? {branch: branch.value} : {}),
    ...(search.value ? {q: search.value} : {}), ...(sortKey.value !== 'ease' ? {sort: sortKey.value} : {})}});
});

// One pass per filter change: wording, branch and search first (the label chips count that set), then labels.
const searchLc = computed(() => search.value.trim().toLowerCase());
const base = computed(() => data.value.inScope.filter(q =>
  matches(q, {wording: wording.value, branch: branch.value, search: searchLc.value})));
const labelCounts = computed(() => countBy(base.value, 'label'));
const filtered = computed(() => base.value.filter(q => labels.value.has(q.label)));
const total = computed(() => statsFor(filtered.value, data.value.arms));
const rows = computed(() => needRows(data.value, filtered.value));
// The shape always shows every branch (the branch filter narrows the ladder), with the other filters applied.
const branchStats = computed(() => {
  const byBranch = groupBy(data.value.inScope.filter(q =>
    matches(q, {labels: labels.value, wording: wording.value, search: searchLc.value})), 'branch');
  return data.value.branches.map(b => ({branch: b, stats: statsFor(byBranch[b.id] || [], data.value.arms)}));
});
const allCounts = computed(() => countBy(data.value.inScope, 'label'));
const inScopeNeeds = computed(() => Object.values(data.value.needs).filter(n => n.scope === 'in').length);

// Easiest first reads as a ladder: needs grouped under their typical rung. Other sorts are one flat list.
const groups = computed(() => {
  const sorted = sortRows(rows.value, sortKey.value, data.value.launch.key);
  if (sortKey.value !== 'ease') return [{key: 'all', rung: null, rows: sorted}];
  return data.value.rungs.map(r => ({key: r.n, rung: r, rows: sorted.filter(x => x.stats.typicalRung === r.n)}))
    .filter(g => g.rows.length);
});
</script>

<style scoped>
.qm-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ox-text-muted); }
/* Not sticky: on an iPad the filters scroll away with the page (Jason, 2026-10-10). */
.qm-controls {
  max-width: 1200px; margin: 16px auto 0; padding: 12px 0; border-bottom: 1px solid var(--ox-border-subtle);
  display: flex; flex-direction: column; gap: 8px;
}
.ctl-label { font-size: 12px; font-weight: 600; color: var(--ox-text-muted); width: 64px; }
.qm-search { margin-left: 70px; max-width: 360px; font-size: 14px; padding: 6px 10px; border: 1px solid var(--ox-border-default); border-radius: 8px; }
.says-list { margin: 0; padding-left: 22px; max-width: 860px; }
.says-list li { font-size: 16px; line-height: 1.6; color: var(--ox-text-secondary); margin-bottom: 10px; padding-left: 4px; }
.says-list b { color: var(--ox-text-primary); }
.says-note { font-size: 13px; color: var(--ox-text-muted); margin: 4px 0 0; }
.shape { display: flex; flex-direction: column; gap: 12px; }
.shape-row { display: grid; grid-template-columns: 220px 1fr 64px 120px; gap: 16px; align-items: center; }
.shape-name { font-size: 15px; font-weight: 500; }
.shape-n { font-size: 13px; color: var(--ox-text-muted); text-align: right; font-variant-numeric: tabular-nums; }
.ladder-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
.sort { font-size: 13px; color: var(--ox-text-muted); }
.sort select { margin-left: 6px; border: 1px solid var(--ox-border-default); border-radius: 6px; padding: 3px 6px; font-size: 13px; color: var(--ox-text-primary); }
.lr {
  display: grid; grid-template-columns: minmax(260px, 1fr) 180px 72px 56px 56px 56px 72px 48px 84px;
  gap: 12px; align-items: center; padding: 12px 8px; border-top: 1px solid var(--ox-border-subtle); color: inherit; text-decoration: none;
}
a.lr:hover { background: var(--ox-bg-subtle); }
.lh { font-size: 12px; font-weight: 600; color: var(--ox-text-muted); border-top: 0; padding-bottom: 6px; }
.lh .num { font-size: 12px; color: var(--ox-text-muted); }
.need-name { font-size: 15px; font-weight: 600; color: var(--ox-text-primary); }
.need-job { font-size: 13px; color: var(--ox-text-tertiary); line-height: 1.45; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.need-branch { font-size: 11.5px; color: var(--ox-text-muted); margin-top: 3px; }
.num.strong { font-weight: 600; color: var(--ox-text-primary); }
.num.dim { color: var(--ox-text-disabled); }
.how { border-collapse: collapse; margin-bottom: 16px; }
.how td { padding: 8px 12px 8px 0; border-top: 1px solid var(--ox-border-subtle); font-size: 14px; vertical-align: top; }
.how-name { font-weight: 600; white-space: nowrap; }
.how-story { color: var(--ox-text-tertiary); }
.notes { font-size: 14px; line-height: 1.6; color: var(--ox-text-tertiary); padding-left: 18px; max-width: 860px; }
.notes li { margin-bottom: 6px; }
/* Narrower screens keep how common a need is and drop the cheaper models first. Children: 1 need, 2 bar,
   3 one query, 4-6 the arms (cheapest first), 7 questions, 8 real, 9 logged. */
@media (max-width: 1100px) {
  .lr { grid-template-columns: minmax(200px, 1fr) 120px 64px 52px 64px 44px 72px; }
  .lr > :nth-child(4), .lr > :nth-child(5) { display: none; }
}
@media (max-width: 760px) {
  .lr { grid-template-columns: 1fr 80px 52px 52px; }
  .lr > :nth-child(7), .lr > :nth-child(8), .lr > :nth-child(9) { display: none; }
  .shape-row { grid-template-columns: 1fr; gap: 4px; }
  .shape-n { text-align: left; }
  .qm-search { margin-left: 0; }
}
</style>
