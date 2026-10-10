<template>
  <v-dialog :model-value="!!q" max-width="760" scrollable @update:model-value="v => { if (!v) emit('close'); }">
    <div v-if="q" class="ad">
      <div class="ad-head">
        <span class="ad-strip" :style="{background: wording?.color}" :title="wording?.name" />
        <div class="ad-q">
          <div class="ad-text" :class="{model: q.wording === 'model'}">{{ q.text }}</div>
          <div class="ad-meta">{{ wording?.name }} · {{ q.detail }} · {{ data.needs[q.need]?.name }}</div>
        </div>
        <div class="ad-nav">
          <button type="button" aria-label="Previous question" :disabled="!hasPrev" @click="emit('step', -1)">‹</button>
          <button type="button" aria-label="Next question" :disabled="!hasNext" @click="emit('step', 1)">›</button>
          <button type="button" aria-label="Close" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="ad-body">
        <blockquote v-if="q.evidence" class="ad-evidence">
          <span class="ad-label">The source's words</span>{{ q.evidence }}
        </blockquote>

        <div class="ad-tabs" role="tablist">
          <button v-for="a in data.arms" :key="a.key" type="button" role="tab" class="ad-tab" :class="{on: a.key === arm}"
                  :aria-selected="a.key === arm" @click="emit('arm', a.key)">
            <span class="mk" :class="mark(q.runs?.[a.key]).key">{{ mark(q.runs?.[a.key]).icon }}</span>{{ a.name }}
          </button>
        </div>

        <template v-if="run">
          <div class="ad-verdict">
            <b>{{ verdictText }}</b>
            <span class="muted">{{ costText }}</span>
          </div>
          <code-block v-if="run.oql" :code="run.oql" :line-numbers="false" />
          <div v-else class="muted">No query submitted{{ run.error ? ` (${run.error})` : '' }}.</div>
          <div v-if="run.sort" class="muted small">sort: {{ run.sort }}</div>
          <p v-if="run.note" class="ad-note">“{{ run.note }}”</p>
          <preview-table :run="run" />

          <div class="ad-judge">
            <span class="ad-label">Judge</span>
            <span v-if="run.how === 'match'">The result matches the checked gold query.</span>
            <span v-else>{{ run.reason || 'Not judged.' }}</span>
          </div>

          <div v-if="run.verdict" class="ad-fb">
            <span class="ad-label">Is the judge right?</span>
            <div class="ad-fb-row">
              <button type="button" class="chip" :class="{on: fb.call === 'agrees'}" @click="setCall('agrees')">Yes</button>
              <button type="button" class="chip" :class="{on: fb.call === 'disagrees'}" @click="setCall('disagrees')">No</button>
              <input class="ad-fb-note" :value="fb.note || ''" placeholder="Why (optional)" @change="e => setNote(e.target.value)">
            </div>
          </div>
        </template>
        <div v-else class="muted ad-none">{{ q.kind === 'data' ? 'Not run yet.' : 'Not run: not a data question.' }}</div>

        <details v-if="ref" class="ad-ref">
          <summary>Reference OQL <span class="muted">· {{ ref.by }}</span></summary>
          <code-block :code="ref.oql" :line-numbers="false" />
          <div v-if="ref.sort" class="muted small">sort: {{ ref.sort }}</div>
        </details>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import {computed} from 'vue';
import CodeBlock from '@/components/CodeBlock.vue';
import PreviewTable from './PreviewTable.vue';
import {feedbackKey, mark, referenceOql} from '@/questionMap';

defineOptions({name: 'AnswerDialog'});

const props = defineProps({
  q: {type: Object, default: null},          // the question shown; null = closed
  arm: {type: String, required: true},
  data: {type: Object, required: true},
  feedback: {type: Object, required: true},   // {"<id>|<arm>": {call, note}}
  hasPrev: {type: Boolean, default: false},
  hasNext: {type: Boolean, default: false},
});
const emit = defineEmits(['close', 'arm', 'step', 'feedback']);

const run = computed(() => props.q?.runs?.[props.arm]);
const wording = computed(() => props.data.wordingByKey[props.q?.wording]);
const ref = computed(() => props.q && referenceOql(props.q, props.data.launch.key));
const fb = computed(() => props.feedback[feedbackKey(props.q, props.arm)] || {});
const VERDICTS = {answers: 'Answers it', partly: 'Answers part of it', no: "Doesn't answer it"};
const verdictText = computed(() => (run.value?.verdict ? VERDICTS[run.value.verdict]
  : run.value?.check === 'no_submit' ? 'No answer' : 'Not judged yet'));
const costText = computed(() => [run.value?.seconds != null ? `${Math.round(run.value.seconds)} s` : null,
  run.value?.cost != null ? `${(run.value.cost * 100).toFixed(1)}¢` : null].filter(Boolean).join(' · '));

const setCall = call => emit('feedback', {q: props.q, arm: props.arm, value: {...fb.value, call: fb.value.call === call ? null : call}});
const setNote = note => emit('feedback', {q: props.q, arm: props.arm, value: {...fb.value, note}});
</script>

<style scoped>
.ad { background: var(--ox-bg-base); border-radius: 14px; display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
.ad-head { display: flex; gap: 12px; padding: 16px 16px 12px; border-bottom: 1px solid var(--ox-border-subtle); }
.ad-strip { width: 5px; border-radius: 3px; flex-shrink: 0; }
.ad-q { flex: 1; min-width: 0; }
.ad-text { font-size: 16px; line-height: 1.5; color: var(--ox-text-primary); }
.ad-text.model { font-style: italic; }
.ad-meta { font-size: 12.5px; color: var(--ox-text-muted); margin-top: 4px; }
.ad-nav { display: flex; gap: 4px; align-items: flex-start; }
.ad-nav button { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--ox-border-default); background: var(--ox-bg-base); font-size: 18px; color: var(--ox-text-secondary); }
.ad-nav button:disabled { opacity: 0.3; }
.ad-body { padding: 12px 16px 20px; overflow-y: auto; }
.ad-evidence { margin: 0 0 12px; padding: 8px 12px; border-left: 3px solid var(--ox-border-default); font-size: 14px; line-height: 1.5; color: var(--ox-text-secondary); }
.ad-label { display: block; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ox-text-tertiary); margin-bottom: 4px; }
.ad-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.ad-tab { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; border: 1px solid var(--ox-border-default); background: var(--ox-bg-base); font-size: 14px; color: var(--ox-text-secondary); }
.ad-tab.on { border-color: var(--ox-text-primary); color: var(--ox-text-primary); font-weight: 600; }
.ad-verdict { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; font-size: 15px; }
.ad-note { font-size: 14px; color: var(--ox-text-secondary); margin: 10px 0; line-height: 1.5; }
.ad-judge { margin-top: 14px; padding: 10px 12px; background: var(--ox-bg-subtle); border-radius: 10px; font-size: 14px; line-height: 1.5; color: var(--ox-text-secondary); }
.ad-fb { margin-top: 14px; }
.ad-fb-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.ad-fb-note { flex: 1; min-width: 180px; font-size: 14px; padding: 7px 10px; border: 1px solid var(--ox-border-default); border-radius: 8px; }
.ad-ref { margin-top: 16px; font-size: 13.5px; }
.ad-ref summary { cursor: pointer; color: var(--ox-text-secondary); margin-bottom: 6px; }
.ad-none { padding: 12px 0; }
.chip { font-size: 14px; padding: 6px 16px; border-radius: 999px; border: 1px solid var(--ox-border-default); background: var(--ox-bg-base); color: var(--ox-text-secondary); }
.chip.on { background: var(--ox-bg-inverse); border-color: var(--ox-bg-inverse); color: var(--ox-text-inverse); }
.mk { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; font-size: 12px; font-weight: 700; }
.mk.good { background: var(--ox-success-bg); color: var(--ox-success-fg); }
.mk.partly { background: var(--ox-warning-bg); color: var(--ox-warning-fg); }
.mk.bad { background: var(--ox-danger-bg); color: var(--ox-danger-fg); }
.mk.none { background: var(--ox-bg-muted); color: var(--ox-text-muted); }
.muted { color: var(--ox-text-muted); }
.small { font-size: 12px; }
</style>
