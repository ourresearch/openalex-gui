<template>
  <div class="q">
    <button class="q-head" type="button" :aria-expanded="open" @click="open = !open">
      <div class="q-main">
        <div class="q-text">{{ q.text }}</div>
        <div class="q-source">
          <span class="q-label" :class="'lab-' + q.label">{{ labelName }}</span>
          <span v-if="q.wording === 'model'" class="q-model" title="A model wrote this question">model-written</span>
          <span>{{ q.detail }}</span>
        </div>
      </div>
      <div class="q-side">
        <span v-if="rung" class="q-rung" :title="rung.name">
          <span class="swatch" :style="{background: RUNG_COLORS[rung.n]}" />{{ rung.n }}
        </span>
        <span v-for="a in answers" :key="a.key" class="q-mark" :class="a.mark" :title="`${a.name}: ${a.verdict}`">{{ a.icon }}</span>
      </div>
    </button>

    <div v-if="open" class="q-body">
      <div v-if="q.evidence" class="block">
        <div class="block-title">The evidence, in the source's words</div>
        <blockquote>{{ q.evidence }}</blockquote>
        <div class="muted small">It isn't a question, so #1555's grader wrote the question above from it; the models were asked that.</div>
      </div>
      <div v-if="q.url" class="q-link"><a :href="q.url" target="_blank" rel="noopener">Source ↗</a></div>
      <div v-if="rung" class="q-rung-line">
        <span class="swatch" :style="{background: RUNG_COLORS[rung.n]}" /> <b>{{ rung.name }}.</b> {{ rung.story }}
      </div>

      <div v-if="oqlForm" class="block">
        <div class="block-title">OQL form <span class="muted">· {{ oqlForm.by }}</span></div>
        <code-block :code="oqlForm.oql" :line-numbers="false" />
        <div v-if="oqlForm.sort" class="muted small">sort: {{ oqlForm.sort }}</div>
      </div>
      <div v-if="gaps.length" class="block">
        <div class="block-title">What stands in the way</div>
        <div class="gaps"><span v-for="g in gaps" :key="g" class="gap">{{ data.gaps[g] || g }}</span></div>
        <div v-if="q.grade.missing" class="muted small">{{ q.grade.missing }}</div>
      </div>

      <div class="answers">
        <div v-for="a in answers" :key="a.key" class="ans">
          <div class="ans-head">
            <span class="q-mark" :class="a.mark">{{ a.icon }}</span>
            <b>{{ a.name }}</b>
            <span class="verdict">{{ a.verdict }}</span>
            <span v-if="a.r" class="muted small ans-cost">{{ a.cost }}</span>
          </div>
          <template v-if="a.r">
            <code-block v-if="a.r.oql" :code="a.r.oql" :line-numbers="false" />
            <div v-else class="muted small">No query submitted{{ a.r.error ? ` (${a.r.error})` : '' }}.</div>
            <div v-if="a.r.sort" class="muted small">sort: {{ a.r.sort }}</div>
            <p v-if="a.r.note" class="note">“{{ a.r.note }}”</p>
            <preview-table :run="a.r" />
            <p v-if="a.r.reason" class="reason"><span class="muted">Judge:</span> {{ a.r.reason }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import {RUNG_COLORS} from '@/questionMap';
import CodeBlock from '@/components/CodeBlock.vue';
import PreviewTable from './PreviewTable.vue';

defineOptions({name: 'QuestionRow'});

const props = defineProps({
  q: {type: Object, required: true},
  data: {type: Object, required: true},   // the loaded map: rungs, labels, arms, gaps
  startOpen: {type: Boolean, default: false},
});

const open = ref(props.startOpen);
const labelName = computed(() => props.data.labels.find(l => l.key === props.q.label)?.name || props.q.label);
const rung = computed(() => props.data.rungs.find(r => r.n === props.q.rung));
const gaps = computed(() => (props.q.rung >= 3 ? props.q.grade?.gaps || [] : []));

// The one query that answers it: #1492's checked gold, else #1555's grader's query (not checked).
const oqlForm = computed(() => {
  const q = props.q;
  if (q.gold?.oql) return {oql: q.gold.oql, sort: q.gold.sort, by: q.gold.by};
  if (!q.grade?.oql) return null;
  return {oql: q.grade.oql, by: `#1555's grader, ${q.grade.fit === 'full' ? 'a full answer' : 'the closest it could get'}; `
    + `parsed${q.grade.valid ? '' : ' with errors'}, not checked by hand`};
});

const VERDICTS = {answers: 'answers it', partly: 'answers part of it', no: "doesn't answer it"};
const answers = computed(() => props.data.arms.map(a => {
  const r = props.q.runs?.[a.key];
  const mark = !r?.verdict ? 'none' : r.correct ? 'good' : r.verdict === 'partly' ? 'partly' : 'bad';
  let verdict;
  if (!r) verdict = props.q.kind === 'data' ? 'not run yet' : 'not run: not a data question';
  else if (!r.verdict) verdict = r.check === 'no_submit' ? 'no answer' : 'not judged yet';
  else verdict = VERDICTS[r.verdict] + (r.how === 'match' ? ' (matches the gold)' : '');
  const cost = r ? [r.seconds != null ? `${Math.round(r.seconds)} s` : null,
    r.cost != null ? `${(r.cost * 100).toFixed(1)}¢` : null].filter(Boolean).join(' · ') : '';
  return {...a, r, mark, verdict, cost, icon: {good: '✓', partly: '◐', bad: '✕', none: '–'}[mark]};
}));
</script>

<style scoped>
.q { border-top: 1px solid var(--ox-border-subtle); }
.q-head { display: flex; gap: 16px; width: 100%; text-align: left; padding: 12px 4px; background: none; border: 0; cursor: pointer; align-items: flex-start; }
.q-head:hover .q-text { color: var(--ox-text-primary); }
.q-main { flex: 1; min-width: 0; }
.q-text { font-size: 15px; line-height: 1.5; color: var(--ox-text-secondary); }
.q-source { margin-top: 3px; font-size: 12.5px; color: var(--ox-text-muted); display: flex; gap: 8px; flex-wrap: wrap; }
.q-label { font-weight: 600; color: var(--ox-text-tertiary); }
.q-label.lab-synthetic { color: var(--ox-text-disabled); font-style: italic; }
.q-model { font-size: 11.5px; border: 1px dashed var(--ox-border-strong); border-radius: 999px; padding: 0 7px; }
.q-side { display: flex; gap: 6px; align-items: center; flex-shrink: 0; padding-top: 2px; }
.q-rung { font-size: 12px; color: var(--ox-text-tertiary); display: inline-flex; align-items: center; gap: 4px; width: 30px; }
.swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; vertical-align: -1px; }
.q-mark { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; font-size: 12px; font-weight: 700; }
.q-mark.good { background: var(--ox-success-bg); color: var(--ox-success-fg); }
.q-mark.partly { background: var(--ox-warning-bg); color: var(--ox-warning-fg); }
.q-mark.bad { background: var(--ox-danger-bg); color: var(--ox-danger-fg); }
.q-mark.none { background: var(--ox-bg-muted); color: var(--ox-text-muted); }
.q-body { padding: 4px 4px 20px; }
.q-link { font-size: 13px; margin-bottom: 8px; }
.q-rung-line { font-size: 13.5px; color: var(--ox-text-tertiary); margin-bottom: 12px; }
.block { margin: 12px 0; }
.block-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ox-text-tertiary); margin-bottom: 6px; }
blockquote { margin: 0 0 4px; padding: 8px 12px; border-left: 3px solid var(--ox-border-default); color: var(--ox-text-secondary); font-size: 14px; line-height: 1.55; }
.gaps { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
.gap { font-size: 12.5px; background: var(--ox-bg-muted); border-radius: 999px; padding: 2px 10px; color: var(--ox-text-secondary); }
.answers { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-top: 16px; }
.ans { border: 1px solid var(--ox-border-default); border-radius: 10px; padding: 12px; min-width: 0; }
.ans-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; }
.ans-cost { margin-left: auto; }
.verdict { font-size: 13px; color: var(--ox-text-tertiary); }
.note { font-size: 13px; color: var(--ox-text-secondary); margin: 8px 0; line-height: 1.5; }
.reason { font-size: 12.5px; color: var(--ox-text-secondary); margin: 8px 0 0; line-height: 1.5; }
.muted { color: var(--ox-text-muted); }
.small { font-size: 12px; }
</style>
