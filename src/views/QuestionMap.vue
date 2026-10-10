<template>
  <div class="qm">
    <header class="qm-hero">
      <div class="qm-eyebrow">Natural language · Staff only</div>
      <h1>The question map</h1>
      <p class="qm-lede">
        Every question we want OQL and the chat agent to answer, grouped by the need behind it and ordered from
        easiest to hardest. The needs come from the map of what people use the literature for; the questions from
        real users, our logs, Kyle's work and published sources, with synthetic ones labelled.
      </p>
    </header>

    <div v-if="error" class="qm-msg">{{ error }}</div>
    <div v-else-if="!data" class="qm-msg">Loading the map…</div>

    <template v-else>
      <div class="qm-controls">
        <div class="chips" role="group" aria-label="Sources">
          <span class="ctl-label">Sources</span>
          <button
            v-for="l in data.labels"
            :key="l.key"
            type="button"
            class="chip"
            :class="{on: labels.has(l.key)}"
            :title="l.story"
            @click="toggleLabel(l.key)"
          >{{ l.name }} <span class="chip-n">{{ labelCounts[l.key] || 0 }}</span></button>
          <button type="button" class="chip quiet" @click="onlyReal">Real users only</button>
          <button v-if="labels.size !== data.labels.length" type="button" class="chip quiet" @click="allLabels">All</button>
        </div>
        <div class="chips" role="group" aria-label="Wording">
          <span class="ctl-label">Wording</span>
          <button type="button" class="chip" :class="{on: !wording}" @click="wording = null">All</button>
          <button v-for="w in wordings" :key="w.key" type="button" class="chip" :class="{on: wording === w.key}"
                  :title="w.story" @click="wording = wording === w.key ? null : w.key">{{ w.name }}</button>
        </div>
        <div class="chips" role="group" aria-label="Branch">
          <span class="ctl-label">Branch</span>
          <button type="button" class="chip" :class="{on: !branch}" @click="branch = null">All</button>
          <button
            v-for="b in data.branches"
            :key="b.id"
            type="button"
            class="chip"
            :class="{on: branch === b.id}"
            @click="branch = branch === b.id ? null : b.id"
          >{{ b.name }}</button>
        </div>
        <input v-model="search" class="qm-search" type="search" placeholder="Find a question…" aria-label="Find a question">
      </div>

      <section class="tiles">
        <div class="tile"><div class="tile-n">{{ rows.length }}</div><div class="tile-l">needs</div></div>
        <div class="tile"><div class="tile-n">{{ num(total.n) }}</div><div class="tile-l">questions</div></div>
        <div class="tile"><div class="tile-n">{{ pct(total.n ? total.real / total.n : null) }}</div><div class="tile-l">from real users</div></div>
        <div class="tile"><div class="tile-n">{{ pct(total.n ? total.own / total.n : null) }}</div><div class="tile-l">in the source's own words</div></div>
        <div class="tile"><div class="tile-n">{{ pct(total.oneQuery) }}</div><div class="tile-l">one OQL query answers it today</div></div>
        <div class="tile"><div class="tile-n">{{ pct(total.arms.opus.share) }}</div><div class="tile-l">the launch agent gets right</div></div>
      </section>

      <section v-if="data.summary && data.summary.length" class="qm-section says">
        <h2>What the map says</h2>
        <ol class="says-list">
          <li v-for="(x, i) in data.summary" :key="i"><b>{{ x.headline }}</b> {{ x.body }}</li>
        </ol>
        <p class="says-note">Read from every source, as of {{ data.meta.built }}; the filters above don't change it.</p>
      </section>

      <section class="qm-section">
        <h2>The shape</h2>
        <p class="qm-body">How hard each branch's questions are, on five rungs. The light blue is what works today.</p>
        <div class="legend">
          <span v-for="r in data.rungs" :key="r.n" class="legend-item" :title="r.story">
            <span class="swatch" :style="{background: rungColors[r.n]}" />{{ r.n }} · {{ r.name }}
          </span>
        </div>
        <div class="shape">
          <div v-for="b in branchStats" :key="b.branch.id" class="shape-row">
            <div class="shape-name">{{ b.branch.name }}</div>
            <rung-bar :rungs="b.stats.rungs" :names="data.rungs" :height="18" />
            <div class="shape-n">{{ num(b.stats.n) }}</div>
            <div class="shape-pct">{{ pct(b.stats.oneQuery) }} one query</div>
          </div>
        </div>
      </section>

      <section class="qm-section wide">
        <div class="ladder-head">
          <h2>Every need, {{ sortKey === 'ease' ? 'easiest first' : 'sorted by ' + sortNames[sortKey] }}</h2>
          <label class="sort">Sort
            <select v-model="sortKey">
              <option v-for="(n, k) in sortNames" :key="k" :value="k">{{ n }}</option>
            </select>
          </label>
        </div>
        <p class="qm-body">
          Each row is one need: what someone is trying to get done. Click it for its questions and every model's answers.
        </p>
        <div class="ladder" role="table">
          <div class="lr lh" role="row">
            <div role="columnheader">Need</div>
            <div role="columnheader">Difficulty</div>
            <div role="columnheader" class="num" title="Share of its questions one OQL query answers today (rungs 1 and 2)">One query</div>
            <div v-for="a in arms" :key="a.key" role="columnheader" class="num arm" :title="`${a.name}: share of data questions judged right`">{{ a.name }}</div>
            <div role="columnheader" class="num">Questions</div>
            <div role="columnheader" class="num" title="Questions from real users">Real</div>
            <div role="columnheader" class="num common" title="Distinct website users plus API keys a week on this need's logged query shapes (one week, Sept 2026)">Logged a week</div>
          </div>
          <template v-for="g in groups" :key="g.key">
            <div v-if="g.rung" class="lg" role="row">
              <span class="swatch" :style="{background: rungColors[g.rung.n]}" />
              <b>{{ g.rung.n }} · {{ g.rung.name }}</b>
              <span class="lg-story">{{ g.rung.story }}</span>
              <span class="lg-n">{{ g.rows.length }} needs</span>
            </div>
            <router-link
              v-for="r in g.rows"
              :key="r.need.id"
              class="lr"
              role="row"
              :to="{name: 'QuestionMapNeed', params: {need: r.need.id}, query: linkQuery}"
            >
              <div class="need">
                <div class="need-name">{{ r.need.name }}</div>
                <div class="need-job">{{ r.need.job }}</div>
                <div class="need-branch">{{ r.branch.name }} · {{ r.node.name }}</div>
              </div>
              <div class="bar-cell"><rung-bar :rungs="r.stats.rungs" :names="data.rungs" /></div>
              <div class="num strong">{{ pct(r.stats.oneQuery) }}</div>
              <div v-for="a in arms" :key="a.key" class="num arm" :class="{dim: r.stats.arms[a.key].tested < 3}"
                   :title="`${r.stats.arms[a.key].right} of ${r.stats.arms[a.key].tested} right`">
                {{ pct(r.stats.arms[a.key].share) }}
              </div>
              <div class="num">{{ r.stats.n }}</div>
              <div class="num">{{ r.stats.real || '–' }}</div>
              <div class="num common">{{ num(askers(r.need)) }}</div>
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
          <li><b>Needs</b> are the 123 in-scope leaves of the map of what people use the literature for (#1602).</li>
          <li><b>Rungs.</b> {{ data.rungs.map(r => `${r.n}: ${r.name}`).join('; ') }}. Rungs 3 to 5 come from #1555's
            grading of OQL against every map question; rungs 1 and 2 from the launch agent's answer.</li>
          <li><b>Models</b> answer as the chat panel would: {{ data.meta.configuration }}. {{ Object.values(data.meta.arms).join('; ') }}.
            Judged by {{ data.meta.judge }}. Models are graded on data questions only.</li>
          <li><b>Logged a week</b>: {{ data.meta.logs }}. Only the most common query shapes were sampled, so a dash means
            "not among them", not "never asked".</li>
          <li><b>#1494's held-back test questions</b> are not on this page; they are run once, at the end.</li>
          <li>Built {{ data.meta.built }} by oxjob #1618.</li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import RungBar from '@/components/QuestionMap/RungBar.vue';
import {ARMS, RUNG_COLORS, WORDINGS, askers, loadQuestionMap, matches, needRows, num, pct, sortRows, statsFor} from '@/questionMap';

defineOptions({name: 'QuestionMap'});

const route = useRoute();
const router = useRouter();
const data = ref(null);
const error = ref(null);
const arms = ARMS;
const wordings = WORDINGS;
const rungColors = RUNG_COLORS;
const sortNames = {ease: 'easiest first', common: 'most logged', real: 'most real users', questions: 'most questions',
  opus: 'Opus worst first', oneQuery: 'one query today'};

// Filters live in the URL so a link (or the back button) keeps them.
const labels = ref(new Set());
const branch = ref(route.query.branch || null);
const search = ref(route.query.q || '');
const wording = ref(WORDINGS.some(w => w.key === route.query.wording) ? route.query.wording : null);
const sortKey = ref(sortNames[route.query.sort] ? route.query.sort : 'ease');

onMounted(async () => {
  try {
    data.value = await loadQuestionMap();
    const fromUrl = (route.query.sources || '').split(',').filter(k => data.value.labels.some(l => l.key === k));
    labels.value = new Set(fromUrl.length ? fromUrl : data.value.labels.map(l => l.key));
  } catch (e) {
    error.value = e.message;
  }
});

const linkQuery = computed(() => {
  const q = {};
  if (data.value && labels.value.size && labels.value.size !== data.value.labels.length) q.sources = [...labels.value].join(',');
  if (wording.value) q.wording = wording.value;
  return q;
});
watch([labels, wording, branch, search, sortKey], () => {
  router.replace({query: {...linkQuery.value, ...(branch.value ? {branch: branch.value} : {}),
    ...(search.value ? {q: search.value} : {}), ...(sortKey.value !== 'ease' ? {sort: sortKey.value} : {})}});
});

const filter = computed(() => ({labels: labels.value, wording: wording.value, branch: branch.value, search: search.value.trim()}));
const toggleLabel = k => {
  const s = new Set(labels.value);
  s.has(k) ? s.delete(k) : s.add(k);
  labels.value = s;
};
const onlyReal = () => { labels.value = new Set(['real']); };
const allLabels = () => { labels.value = new Set(data.value.labels.map(l => l.key)); };

const inScope = computed(() => data.value ? data.value.questions.filter(q => data.value.needs[q.need]?.scope === 'in') : []);
const allCounts = computed(() => statsFor(inScope.value).byLabel);
const labelCounts = computed(() => statsFor(inScope.value.filter(q => matches(q, {search: filter.value.search, wording: wording.value})
  && (!branch.value || data.value.needs[q.need].branch === branch.value))).byLabel);

const rows = computed(() => (data.value ? needRows(data.value, filter.value) : []));
const total = computed(() => statsFor(inScope.value.filter(q => matches(q, filter.value)
  && (!branch.value || data.value.needs[q.need].branch === branch.value))));
const branchStats = computed(() => data.value.branches.map(b => ({
  branch: b,
  stats: statsFor(inScope.value.filter(q => data.value.needs[q.need].branch === b.id && matches(q, filter.value))),
})));

// Easiest first reads as a ladder: needs grouped under their typical rung. Other sorts are one flat list.
const groups = computed(() => {
  const sorted = sortRows(rows.value, sortKey.value);
  if (sortKey.value !== 'ease') return [{key: 'all', rung: null, rows: sorted}];
  return data.value.rungs.map(r => ({key: r.n, rung: r, rows: sorted.filter(x => x.stats.typicalRung === r.n)}))
    .filter(g => g.rows.length);
});
</script>

<style scoped>
.qm { background: #fff; padding: 0 24px 80px; color: #0a0a0a; }
.qm-hero { max-width: 848px; margin: 0 auto; padding: 64px 0 16px; }
.qm-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #71717a; margin-bottom: 12px; }
.qm-hero h1 { font-size: 44px; font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 16px; }
.qm-lede { font-size: 17px; line-height: 1.65; color: #52525b; margin: 0; }
.qm-msg { max-width: 848px; margin: 24px auto; color: #52525b; font-size: 15px; }
.qm-controls {
  position: sticky; top: 64px; z-index: 4; background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(6px);
  max-width: 1200px; margin: 16px auto 0; padding: 12px 0; border-bottom: 1px solid #f0f0f1;
  display: flex; flex-direction: column; gap: 8px;
}
.chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ctl-label { font-size: 12px; font-weight: 600; color: #71717a; width: 64px; }
.chip {
  font-size: 13px; padding: 4px 11px; border-radius: 999px; border: 1px solid #e4e4e7; background: #fff; color: #52525b;
  cursor: pointer; line-height: 1.4;
}
.chip.on { background: #18181b; border-color: #18181b; color: #fff; }
.chip.quiet { border-style: dashed; }
.chip-n { opacity: 0.6; margin-left: 2px; font-variant-numeric: tabular-nums; }
.qm-search { margin-left: 70px; max-width: 360px; font-size: 14px; padding: 6px 10px; border: 1px solid #e4e4e7; border-radius: 8px; }
.tiles { max-width: 1200px; margin: 24px auto 8px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.tile { border: 1px solid #ececee; border-radius: 12px; padding: 14px 16px; }
.tile-n { font-size: 30px; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.tile-l { font-size: 13px; color: #71717a; margin-top: 2px; line-height: 1.35; }
.qm-section { max-width: 1200px; margin: 40px auto 0; }
.qm-section h2 { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 8px; }
.qm-body { font-size: 15px; line-height: 1.6; color: #52525b; margin: 0 0 14px; max-width: 760px; }
.says-list { margin: 0; padding-left: 22px; max-width: 860px; }
.says-list li { font-size: 16px; line-height: 1.6; color: #3f3f46; margin-bottom: 10px; padding-left: 4px; }
.says-list b { color: #0a0a0a; }
.says-note { font-size: 13px; color: #a1a1aa; margin: 4px 0 0; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: #3f3f46; margin-bottom: 16px; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; cursor: default; }
.swatch { display: inline-block; width: 11px; height: 11px; border-radius: 3px; flex-shrink: 0; }
.shape { display: flex; flex-direction: column; gap: 12px; }
.shape-row { display: grid; grid-template-columns: 220px 1fr 64px 120px; gap: 16px; align-items: center; }
.shape-name { font-size: 15px; font-weight: 500; }
.shape-n, .shape-pct { font-size: 13px; color: #71717a; text-align: right; font-variant-numeric: tabular-nums; }
.ladder-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
.sort { font-size: 13px; color: #71717a; }
.sort select { margin-left: 6px; border: 1px solid #e4e4e7; border-radius: 6px; padding: 3px 6px; font-size: 13px; color: #18181b; }
.ladder { margin-top: 4px; }
.lr {
  display: grid; grid-template-columns: minmax(260px, 1fr) 180px 72px 56px 56px 56px 72px 48px 84px;
  gap: 12px; align-items: center; padding: 12px 8px; border-top: 1px solid #f0f0f1; color: inherit; text-decoration: none;
}
a.lr:hover { background: #fafafa; }
.lh { font-size: 12px; font-weight: 600; color: #71717a; border-top: 0; padding-bottom: 6px; }
.lh .num { font-size: 12px; color: #71717a; }
.lg { display: flex; align-items: baseline; gap: 8px; padding: 22px 8px 8px; font-size: 14px; border-top: 1px solid #e4e4e7; flex-wrap: wrap; }
.lg .swatch { align-self: center; }
.lg-story { color: #71717a; font-size: 13px; }
.lg-n { margin-left: auto; color: #a1a1aa; font-size: 12.5px; }
.need-name { font-size: 15px; font-weight: 600; color: #18181b; }
.need-job { font-size: 13px; color: #52525b; line-height: 1.45; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.need-branch { font-size: 11.5px; color: #a1a1aa; margin-top: 3px; }
.num { text-align: right; font-size: 14px; font-variant-numeric: tabular-nums; color: #3f3f46; }
.num.strong { font-weight: 600; color: #18181b; }
.num.dim { color: #c4c4c9; }
.how { border-collapse: collapse; margin-bottom: 16px; }
.how td { padding: 8px 12px 8px 0; border-top: 1px solid #f0f0f1; font-size: 14px; vertical-align: top; }
.how-name { font-weight: 600; white-space: nowrap; }
.how-story { color: #52525b; }
.notes { font-size: 14px; line-height: 1.6; color: #52525b; padding-left: 18px; max-width: 860px; }
.notes li { margin-bottom: 6px; }
/* Narrower screens keep how common a need is and drop the cheaper models first. Children: 1 need, 2 bar,
   3 one query, 4 Haiku, 5 Sonnet, 6 Opus, 7 questions, 8 real, 9 logged. */
@media (max-width: 1100px) {
  .lr { grid-template-columns: minmax(200px, 1fr) 120px 64px 52px 64px 44px 72px; }
  .lr > :nth-child(4), .lr > :nth-child(5) { display: none; }
  .tiles { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 760px) {
  .lr { grid-template-columns: 1fr 80px 52px 52px; }
  .lr > :nth-child(7), .lr > :nth-child(8), .lr > :nth-child(9) { display: none; }
  .shape-row { grid-template-columns: 1fr; gap: 4px; }
  .shape-n, .shape-pct { text-align: left; }
  .tiles { grid-template-columns: repeat(2, 1fr); }
  .qm-search { margin-left: 0; }
  .lh { position: static; }
}
</style>
