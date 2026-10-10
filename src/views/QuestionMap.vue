<template>
  <static-page title="The question map" class="qm">
    <template #eyebrow><span class="qm-eyebrow">Natural language · Staff only</span></template>
    <template #intro>
      Every question we want OQL and the chat agent to answer, one per row: the question, its OQL, and how each model
      did. Tap a model's mark for its answer and the judge's call.
    </template>

    <div v-if="error" class="qm-msg">{{ error }}</div>
    <div v-else-if="!data" class="qm-msg">Loading the map…</div>

    <template v-else>
      <div class="ctl">
        <div class="ctl-chips" role="group" aria-label="Who wrote the words">
          <button v-for="w in data.wordings" :key="w.key" type="button" class="chip" :class="{on: wordings.has(w.key)}"
                  :title="w.story" @click="toggleWording(w.key)">
            <span class="dot" :style="{background: w.color}" />{{ w.name }} <span class="chip-n">{{ wordingCounts[w.key] || 0 }}</span>
          </button>
        </div>
        <div class="ctl-selects">
          <label>Source
            <select v-model="label"><option :value="null">All</option>
              <option v-for="l in data.labels" :key="l.key" :value="l.key">{{ l.name }}</option></select>
          </label>
          <label>Branch
            <select v-model="branch"><option :value="null">All</option>
              <option v-for="b in data.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select>
          </label>
          <label>Type
            <select v-model="need"><option :value="null">All</option>
              <optgroup v-for="b in data.branches" :key="b.id" :label="b.name">
                <template v-for="n in b.nodes" :key="n.id">
                  <option v-for="id in n.needs" :key="id" :value="id">{{ data.needs[id].name }}</option>
                </template>
              </optgroup></select>
          </label>
          <label>Result
            <select v-model="result"><option :value="null">All</option>
              <option v-for="(n, k) in RESULTS" :key="k" :value="k">{{ n }}</option></select>
          </label>
          <label>Order
            <select v-model="sortKey"><option v-for="(n, k) in SORTS" :key="k" :value="k">{{ n }}</option></select>
          </label>
        </div>
        <div class="ctl-row">
          <input v-model="searchInput" type="search" placeholder="Find a question…" aria-label="Find a question">
          <button v-if="feedbackCount" type="button" class="chip on" @click="copyFeedback">
            {{ copied ? 'Copied' : `Copy feedback (${feedbackCount})` }}
          </button>
        </div>
      </div>

      <div class="status">
        <b>{{ num(sorted.length) }}</b> questions
        <span v-for="a in shares" :key="a.key" class="status-arm" :title="`${a.story}: ${a.right} of ${a.tested} judged right`">
          · {{ a.name }} <b>{{ pct(a.share) }}</b></span>
        <button v-if="filtersOn" type="button" class="clear" @click="clearFilters">Clear filters</button>
      </div>

      <details v-if="data.summary?.length" class="says">
        <summary>What the map says</summary>
        <ol><li v-for="(x, i) in data.summary" :key="i"><b>{{ x.headline }}</b> {{ x.body }}</li></ol>
        <p class="muted small">{{ data.meta.wording }}. Models: {{ data.arms.map(a => a.story).join('; ') }};
          judged by {{ data.meta.judge }}. Built {{ data.meta.built }} (oxjob #1618).</p>
      </details>

      <div class="tbl" role="table" aria-label="Questions">
        <div class="row head" role="row">
          <span />
          <div role="columnheader">Question</div>
          <div role="columnheader">OQL · {{ data.arms.map(a => a.name).join(', ') }}</div>
        </div>
        <div v-for="(q, i) in shown" :key="q.id" class="row" role="row">
          <span class="strip" :style="{background: data.wordingByKey[q.wording]?.color}" :title="data.wordingByKey[q.wording]?.name" />
          <div>
            <div class="c-q" :class="{model: q.wording === 'model'}">{{ q.text }}</div>
            <button type="button" class="c-type" :title="`Show only this type`" @click="need = q.need">{{ data.needs[q.need]?.name }}</button>
          </div>
          <div>
            <div class="c-oql">
              <template v-if="refs[q.id]">{{ refs[q.id].oql }}<span v-if="refs[q.id].tag" class="unchecked" :title="refs[q.id].by"> ·{{ refs[q.id].tag === 'agent' ? data.launch.name : 'unchecked draft' }}</span></template>
              <span v-else class="muted">{{ q.kind === 'data' ? '–' : 'not a query' }}</span>
            </div>
            <div class="c-m">
              <button v-for="a in data.arms" :key="a.key" type="button" class="mk" :class="[mark(q.runs?.[a.key]).key, {flag: flagged(q, a.key)}]"
                      :title="a.name" :aria-label="`${a.name}: open answer`" @click="openDialog(i, a.key)">{{ mark(q.runs?.[a.key]).icon }}</button>
            </div>
          </div>
        </div>
        <div ref="sentinel" class="sentinel">{{ shown.length < sorted.length ? 'Loading more…' : '' }}</div>
      </div>

      <answer-dialog :q="dialogQ" :arm="dialogArm" :data="data" :feedback="feedback"
                     :has-prev="dialogIndex > 0" :has-next="dialogIndex < sorted.length - 1"
                     @close="dialogIndex = -1" @arm="a => dialogArm = a" @step="step" @feedback="setFeedback" />
    </template>
  </static-page>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import AnswerDialog from '@/components/QuestionMap/AnswerDialog.vue';
import {RESULTS, SORTS, armShares, countBy, feedbackKey, feedbackText, hasResult, loadFeedback, loadQuestionMap,
  mark, matches, num, pct, referenceOql, saveFeedback, sortQuestions} from '@/questionMap';

defineOptions({name: 'QuestionMap'});

const route = useRoute();
const router = useRouter();
const data = shallowRef(null);
const error = shallowRef(null);

// Filters live in the URL so a link (or the back button) keeps them.
const qy = route.query;
const wordings = shallowRef(new Set());
const label = shallowRef(qy.source || null);
const branch = shallowRef(qy.branch || null);
const need = shallowRef(qy.need || null);
const result = shallowRef(RESULTS[qy.result] ? qy.result : null);
const sortKey = shallowRef(SORTS[qy.order] ? qy.order : 'ease');
const searchInput = shallowRef(qy.q || '');
const search = shallowRef(searchInput.value);

let typing;
watch(searchInput, v => {   // the box answers at once; the list catches up 150 ms after the last keystroke
  clearTimeout(typing);
  typing = setTimeout(() => { search.value = v; }, 150);
});

onMounted(async () => {
  try {
    data.value = await loadQuestionMap();
    const fromUrl = (qy.wording || '').split(',').filter(k => data.value.wordingByKey[k]);
    wordings.value = new Set(fromUrl.length ? fromUrl : data.value.wordings.map(w => w.key));
  } catch (e) {
    error.value = e.message;
  }
});

const toggleWording = k => {
  const s = new Set(wordings.value);
  s.has(k) ? s.delete(k) : s.add(k);
  wordings.value = s;
};
const allWordings = computed(() => data.value && wordings.value.size === data.value.wordings.length);
const filtersOn = computed(() => !allWordings.value || label.value || branch.value || need.value || result.value || search.value);
const clearFilters = () => {
  wordings.value = new Set(data.value.wordings.map(w => w.key));
  label.value = branch.value = need.value = result.value = null;
  searchInput.value = search.value = '';
};

// Render in pages as the list scrolls: ~1,600 rows at once is slow on an iPad.
const PAGE = 150;
const limit = ref(PAGE);

watch([wordings, label, branch, need, result, sortKey, search], () => {
  const q = {};
  if (data.value && !allWordings.value) q.wording = [...wordings.value].join(',');
  for (const [k, v] of [['source', label.value], ['branch', branch.value], ['need', need.value], ['result', result.value],
    ['q', search.value]]) if (v) q[k] = v;
  if (sortKey.value !== 'ease') q.order = sortKey.value;
  router.replace({query: q});
  limit.value = PAGE;
});

// One pass: every filter but wording (the wording chips count that set), then wording, then order.
const base = computed(() => {
  const s = search.value.trim().toLowerCase();
  return data.value.inScope.filter(q => matches(q, {label: label.value, branch: branch.value, need: need.value, search: s})
    && hasResult(q, result.value, data.value));
});
const wordingCounts = computed(() => countBy(base.value, 'wording'));
const sorted = computed(() => sortQuestions(base.value.filter(q => wordings.value.has(q.wording)), sortKey.value, data.value));
const shares = computed(() => armShares(sorted.value, data.value.arms));
const shown = computed(() => sorted.value.slice(0, limit.value));
const refs = computed(() => Object.fromEntries(shown.value.map(q => [q.id, referenceOql(q, data.value.launch.key)])));

const sentinel = ref(null);
let observer;
watch(sentinel, el => {
  observer?.disconnect();
  if (!el) return;
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && limit.value < sorted.value.length) limit.value += PAGE;
  }, {rootMargin: '800px'});
  observer.observe(el);
});
onBeforeUnmount(() => observer?.disconnect());

// The answer dialog steps through the list in its current order.
const dialogIndex = ref(-1);
const dialogArm = ref('opus');
const dialogQ = computed(() => (dialogIndex.value >= 0 ? sorted.value[dialogIndex.value] : null));
const openDialog = (i, arm) => {
  dialogIndex.value = i;
  dialogArm.value = arm;
};
const step = d => {
  dialogIndex.value = Math.min(Math.max(dialogIndex.value + d, 0), sorted.value.length - 1);
  if (dialogIndex.value >= limit.value - 5) limit.value += PAGE;
};

// Jason's calls on the judge: kept in this browser, copied out as text.
const feedback = ref(loadFeedback());
const feedbackCount = computed(() => Object.values(feedback.value).filter(v => v.call || v.note).length);
const flagged = (q, arm) => feedback.value[feedbackKey(q, arm)]?.call === 'disagrees';
const setFeedback = ({q, arm, value}) => {
  feedback.value = {...feedback.value, [feedbackKey(q, arm)]: value};
  saveFeedback(feedback.value);
};
const copied = ref(false);
const copyFeedback = async () => {
  await navigator.clipboard.writeText(feedbackText(feedback.value, data.value));
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
};
</script>

<style scoped>
/* Made for an 11-inch iPad held upright (~820 px). Nothing is sticky: the filters scroll away. */
.qm { padding: 0 16px 80px; color: var(--ox-text-primary); }
.qm-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ox-text-muted); }
.qm-msg { max-width: 848px; margin: 24px auto; color: var(--ox-text-tertiary); font-size: 15px; }
.ctl, .status, .says, .tbl { max-width: 1100px; margin-left: auto; margin-right: auto; }
.ctl { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.ctl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--ox-border-default); background: var(--ox-bg-base); color: var(--ox-text-tertiary); }
.chip.on { background: var(--ox-bg-inverse); border-color: var(--ox-bg-inverse); color: var(--ox-text-inverse); }
.chip-n { opacity: 0.6; font-variant-numeric: tabular-nums; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ctl-selects { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.ctl-selects label { display: flex; flex-direction: column; gap: 2px; font-size: 12px; font-weight: 600; color: var(--ox-text-muted); }
.ctl-selects select { font-size: 14px; font-weight: 400; color: var(--ox-text-primary); padding: 7px 8px; border: 1px solid var(--ox-border-default); border-radius: 8px; background: var(--ox-bg-base); }
.ctl-row { display: flex; gap: 8px; align-items: center; }
.ctl-row input { flex: 1; font-size: 15px; padding: 8px 10px; border: 1px solid var(--ox-border-default); border-radius: 8px; }
.status { margin-top: 14px; font-size: 14px; color: var(--ox-text-secondary); font-variant-numeric: tabular-nums; }
.status-arm { white-space: nowrap; }
.clear { margin-left: 10px; font-size: 13px; color: var(--ox-text-tertiary); text-decoration: underline; background: none; border: 0; }
.says { margin-top: 10px; font-size: 14.5px; line-height: 1.55; color: var(--ox-text-secondary); }
.says summary { cursor: pointer; font-weight: 600; color: var(--ox-text-primary); padding: 4px 0; }
.says ol { padding-left: 20px; margin: 8px 0; }
.says li { margin-bottom: 8px; }
.says b { color: var(--ox-text-primary); }
.tbl { margin-top: 12px; }
.row { display: grid; grid-template-columns: 5px minmax(0, 1fr) minmax(0, 1fr); gap: 14px; align-items: start; padding: 12px 0; border-top: 1px solid var(--ox-border-subtle); }
.row.head { font-size: 12px; font-weight: 600; color: var(--ox-text-muted); border-top: 0; padding-bottom: 6px; }
.strip { align-self: stretch; border-radius: 3px; }
.c-q { font-size: 14.5px; line-height: 1.45; color: var(--ox-text-primary); overflow-wrap: anywhere; }
.c-q.model { font-style: italic; color: var(--ox-text-secondary); }
.c-oql { font-family: 'Roboto Mono', ui-monospace, monospace; font-size: 13.5px; line-height: 1.5; color: var(--ox-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
.unchecked { font-family: inherit; color: var(--ox-text-disabled); }
.c-m { display: flex; gap: 6px; margin-top: 8px; }
.mk { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; font-size: 13px; font-weight: 700; border: 0; }
.mk.good { background: var(--ox-success-bg); color: var(--ox-success-fg); }
.mk.partly { background: var(--ox-warning-bg); color: var(--ox-warning-fg); }
.mk.bad { background: var(--ox-danger-bg); color: var(--ox-danger-fg); }
.mk.none { background: var(--ox-bg-muted); color: var(--ox-text-muted); }
.mk.flag { box-shadow: 0 0 0 2px var(--ox-text-primary); }
.c-type { display: block; text-align: left; margin-top: 4px; font-size: 12.5px; line-height: 1.35; color: var(--ox-text-muted); background: none; border: 0; padding: 0; }
.c-type:hover { text-decoration: underline; }
.sentinel { padding: 16px 0; text-align: center; font-size: 13px; color: var(--ox-text-muted); }
.muted { color: var(--ox-text-muted); }
.small { font-size: 12.5px; }
/* Phones: OQL under the question. */
@media (max-width: 600px) {
  .row { grid-template-columns: 5px minmax(0, 1fr); }
  .strip { grid-row: 1 / span 2; }
  .row > :last-child { grid-column: 2; }
}
</style>
