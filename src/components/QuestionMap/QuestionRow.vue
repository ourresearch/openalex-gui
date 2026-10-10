<template>
  <div class="q" :class="{open}">
    <button class="q-head" type="button" :aria-expanded="open" @click="open = !open">
      <div class="q-main">
        <div class="q-text">{{ q.text }}</div>
        <div class="q-source">
          <span class="q-label" :class="'lab-' + q.label">{{ labelName }}</span>
          <span v-if="q.wording === 'model'" class="q-model" title="A model wrote this question">model-written</span>
          <span class="q-detail">{{ q.detail }}</span>
        </div>
      </div>
      <div class="q-side">
        <span v-if="q.rung" class="q-rung" :title="rungName">
          <span class="swatch" :style="{background: rungColors[q.rung]}" />{{ q.rung }}
        </span>
        <span v-for="a in arms" :key="a.key" class="q-mark" :class="markClass(a.key)" :title="markTitle(a)">
          {{ markIcon(a.key) }}
        </span>
      </div>
    </button>

    <div v-if="open" class="q-body">
      <div v-if="q.evidence" class="q-evidence">
        <div class="block-title">The evidence, in the source's words</div>
        <blockquote>{{ q.evidence }}</blockquote>
        <div class="muted small">It isn't a question, so #1555's grader wrote the question above from it; the models were asked that.</div>
      </div>
      <div v-if="q.url" class="q-link"><a :href="q.url" target="_blank" rel="noopener">Source ↗</a></div>
      <div class="q-rung-line" v-if="q.rung">
        <span class="swatch" :style="{background: rungColors[q.rung]}" />
        <b>{{ rungName }}.</b> {{ rungStory }}
      </div>

      <div class="block" v-if="oqlForm">
        <div class="block-title">OQL form <span class="muted">· {{ oqlForm.by }}</span></div>
        <pre class="oql">{{ oqlForm.oql }}</pre>
        <div v-if="oqlForm.sort" class="muted small">sort: {{ oqlForm.sort }}</div>
      </div>
      <div class="block" v-if="gaps.length">
        <div class="block-title">What stands in the way</div>
        <div class="gaps">
          <span v-for="g in gaps" :key="g" class="gap">{{ gapNames[g] || g }}</span>
        </div>
        <div v-if="q.grade.missing" class="muted small">{{ q.grade.missing }}</div>
      </div>

      <div class="answers">
        <div v-for="a in arms" :key="a.key" class="ans">
          <template v-if="q.runs[a.key]">
            <div class="ans-head">
              <span class="q-mark" :class="markClass(a.key)">{{ markIcon(a.key) }}</span>
              <b>{{ a.name }}</b>
              <span class="verdict">{{ verdictText(q.runs[a.key]) }}</span>
              <span class="muted small ans-cost">{{ costText(q.runs[a.key]) }}</span>
            </div>
            <pre v-if="q.runs[a.key].oql" class="oql">{{ q.runs[a.key].oql }}</pre>
            <div v-else class="muted small">No query submitted{{ q.runs[a.key].error ? ` (${q.runs[a.key].error})` : '' }}.</div>
            <div v-if="q.runs[a.key].sort" class="muted small">sort: {{ q.runs[a.key].sort }}</div>
            <p v-if="q.runs[a.key].note" class="note">“{{ q.runs[a.key].note }}”</p>
            <preview-table :run="q.runs[a.key]" />
            <p v-if="q.runs[a.key].reason" class="reason"><span class="muted">Judge:</span> {{ q.runs[a.key].reason }}</p>
          </template>
          <template v-else>
            <div class="ans-head"><span class="q-mark none">–</span><b>{{ a.name }}</b>
              <span class="muted small">{{ q.kind === 'data' ? 'not run yet' : 'not run: not a data question' }}</span></div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import {ARMS, GAP_NAMES, RUNG_COLORS} from '@/questionMap';
import PreviewTable from './PreviewTable.vue';

defineOptions({name: 'QuestionRow'});

const props = defineProps({
  q: {type: Object, required: true},
  rungs: {type: Array, required: true},
  labels: {type: Array, required: true},
  startOpen: {type: Boolean, default: false},
});

const open = ref(props.startOpen);
const arms = ARMS;
const rungColors = RUNG_COLORS;
const gapNames = GAP_NAMES;

const labelName = computed(() => props.labels.find(l => l.key === props.q.label)?.name || props.q.label);
const rungName = computed(() => props.rungs.find(r => r.n === props.q.rung)?.name);
const rungStory = computed(() => props.rungs.find(r => r.n === props.q.rung)?.story);
const gaps = computed(() => (props.q.rung >= 3 ? props.q.grade?.gaps || [] : []));

// The one query that answers it: #1492's checked gold, else #1555's grader's query (not checked).
const oqlForm = computed(() => {
  const q = props.q;
  if (q.gold?.oql) return {oql: q.gold.oql, sort: q.gold.sort, by: q.gold.by};
  if (q.grade?.oql) {
    const full = q.grade.fit === 'full';
    return {oql: q.grade.oql, by: `#1555's grader, ${full ? 'a full answer' : 'the closest it could get'}; parsed${q.grade.valid ? '' : ' with errors'}, not checked by hand`};
  }
  return null;
});

const run = key => props.q.runs?.[key];
const markClass = key => {
  const r = run(key);
  if (!r || !r.verdict) return 'none';
  return r.correct ? 'good' : r.verdict === 'partly' ? 'partly' : 'bad';
};
const markIcon = key => ({good: '✓', partly: '◐', bad: '✕', none: '–'})[markClass(key)];
const markTitle = a => {
  const r = run(a.key);
  return r?.verdict ? `${a.name}: ${verdictText(r)}` : `${a.name}: not run`;
};
const verdictText = r => {
  if (!r.verdict) return r.check === 'no_submit' ? 'no answer' : 'not judged yet';
  const how = r.how === 'match' ? ' (matches the gold)' : '';
  return {answers: 'answers it', partly: 'answers part of it', no: "doesn't answer it"}[r.verdict] + how;
};
const costText = r => [r.seconds != null ? `${Math.round(r.seconds)} s` : null,
  r.cost != null ? `${(r.cost * 100).toFixed(1)}¢` : null].filter(Boolean).join(' · ');
</script>

<style scoped>
.q { border-top: 1px solid #f0f0f1; }
.q-head {
  display: flex;
  gap: 16px;
  width: 100%;
  text-align: left;
  padding: 12px 4px;
  background: none;
  border: 0;
  cursor: pointer;
  align-items: flex-start;
}
.q-head:hover .q-text { color: #000; }
.q-main { flex: 1; min-width: 0; }
.q-text { font-size: 15px; line-height: 1.5; color: #27272a; }
.q-source { margin-top: 3px; font-size: 12.5px; color: #71717a; display: flex; gap: 8px; flex-wrap: wrap; }
.q-label { font-weight: 600; color: #3f3f46; }
.q-label.lab-synthetic { color: #a1a1aa; font-style: italic; }
.q-model { font-size: 11.5px; border: 1px dashed #d4d4d8; border-radius: 999px; padding: 0 7px; color: #71717a; }
.q-evidence { margin-bottom: 12px; }
.q-evidence blockquote { margin: 0 0 4px; padding: 8px 12px; border-left: 3px solid #e4e4e7; color: #3f3f46; font-size: 14px; line-height: 1.55; }
.q-side { display: flex; gap: 6px; align-items: center; flex-shrink: 0; padding-top: 2px; }
.q-rung { font-size: 12px; color: #52525b; display: inline-flex; align-items: center; gap: 4px; width: 30px; }
.swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; vertical-align: -1px; }
.q-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%; font-size: 12px; font-weight: 700;
}
.q-mark.good { background: #e7f6e7; color: #0a7f0a; }
.q-mark.partly { background: #fdeee7; color: #b4532a; }
.q-mark.bad { background: #fbe9e9; color: #c23434; }
.q-mark.none { background: #f4f4f5; color: #a1a1aa; }
.q-body { padding: 4px 4px 20px; }
.q-link { font-size: 13px; margin-bottom: 8px; }
.q-rung-line { font-size: 13.5px; color: #52525b; margin-bottom: 12px; }
.block { margin: 12px 0; }
.block-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #52525b; margin-bottom: 6px; }
.oql {
  background: #fafafa; border: 1px solid #ececee; border-radius: 8px; padding: 10px 12px;
  font-size: 12.5px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; color: #18181b; margin: 0;
}
.gaps { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
.gap { font-size: 12.5px; background: #f4f4f5; border-radius: 999px; padding: 2px 10px; color: #3f3f46; }
.answers { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-top: 16px; }
.ans { border: 1px solid #ececee; border-radius: 10px; padding: 12px; min-width: 0; }
.ans-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; }
.ans-cost { margin-left: auto; }
.verdict { font-size: 13px; color: #52525b; }
.note { font-size: 13px; color: #3f3f46; margin: 8px 0; line-height: 1.5; }
.reason { font-size: 12.5px; color: #3f3f46; margin: 8px 0 0; line-height: 1.5; }
.muted { color: #71717a; }
.small { font-size: 12px; }
</style>
