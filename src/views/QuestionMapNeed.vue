<template>
  <div class="qm">
    <div v-if="error" class="qm-msg">{{ error }}</div>
    <div v-else-if="!data" class="qm-msg">Loading…</div>
    <div v-else-if="!need" class="qm-msg">No need called “{{ needId }}”. <router-link :to="{name: 'QuestionMap'}">Back to the map</router-link></div>

    <template v-else>
      <header class="qm-hero">
        <nav class="crumbs">
          <router-link :to="{name: 'QuestionMap', query: $route.query}">The question map</router-link>
          <span>›</span><span>{{ branch?.name }}</span>
          <template v-if="node"><span>›</span><span>{{ node.name }}</span></template>
        </nav>
        <h1>{{ need.name }}</h1>
        <p class="qm-lede">{{ need.job }}</p>
        <dl class="facts">
          <div v-if="need.askers?.length"><dt>Who asks</dt><dd>{{ need.askers.join(', ') }}</dd></div>
          <div v-if="need.tools_today?.length"><dt>What they use today</dt><dd>{{ need.tools_today.join(', ') }}</dd></div>
          <div v-if="need.answer_shape"><dt>Answer shape</dt><dd>{{ need.answer_shape }}</dd></div>
          <div v-if="need.in_scope !== true && need.in_scope"><dt>Scope</dt><dd>{{ need.in_scope }}</dd></div>
        </dl>
      </header>

      <section class="tiles">
        <div class="tile"><div class="tile-n">{{ stats.n }}</div><div class="tile-l">questions</div></div>
        <div class="tile"><div class="tile-n">{{ stats.real || '–' }}</div><div class="tile-l">from real users</div></div>
        <div class="tile"><div class="tile-n">{{ stats.own || '–' }}</div><div class="tile-l">in the source's own words</div></div>
        <div class="tile"><div class="tile-n">{{ pct(stats.oneQuery) }}</div><div class="tile-l">one OQL query answers it today</div></div>
        <div v-for="a in arms" :key="a.key" class="tile">
          <div class="tile-n">{{ pct(stats.arms[a.key].share) }}</div>
          <div class="tile-l">{{ a.name }} right ({{ stats.arms[a.key].right }} of {{ stats.arms[a.key].tested }})</div>
        </div>
        <div class="tile"><div class="tile-n">{{ num(askers(need)) }}</div><div class="tile-l">website users and API keys a week (logs)</div></div>
        <div class="tile"><div class="tile-n">{{ num(need.prevalence?.zendesk_tickets) }}</div><div class="tile-l">support tickets</div></div>
      </section>

      <section class="qm-section">
        <h2>How hard</h2>
        <rung-bar :rungs="stats.rungs" :names="data.rungs" :height="18" />
        <div class="legend">
          <span v-for="r in data.rungs" :key="r.n" class="legend-item" :class="{zero: !stats.rungs[r.n]}" :title="r.story">
            <span class="swatch" :style="{background: rungColors[r.n]}" />{{ r.name }} <b>{{ stats.rungs[r.n] }}</b>
          </span>
        </div>
        <div v-if="gapList.length" class="gaps-block">
          <h3>What stands in the way</h3>
          <div v-for="g in gapList" :key="g.code" class="gap-row">
            <span class="gap-name">{{ gapNames[g.code] || g.code }}</span>
            <span class="gap-bar"><span :style="{width: (100 * g.n / gapList[0].n) + '%'}" /></span>
            <span class="gap-n">{{ g.n }}</span>
          </div>
        </div>
      </section>

      <section v-if="pins.success || pins.failure" class="qm-section">
        <h2>One success, one failure</h2>
        <p class="qm-body">Real users' questions first where there are any. Model answers are the launch configuration's.</p>
        <div v-if="pins.success" class="pin"><div class="pin-label good">Opus gets it right</div>
          <question-row :q="pins.success" :rungs="data.rungs" :labels="data.labels" start-open /></div>
        <div v-if="pins.failure" class="pin"><div class="pin-label bad">Opus gets it wrong</div>
          <question-row :q="pins.failure" :rungs="data.rungs" :labels="data.labels" start-open /></div>
      </section>

      <section class="qm-section">
        <div class="list-head">
          <h2>Every question</h2>
          <div class="chips">
            <button v-for="l in data.labels" :key="l.key" type="button" class="chip" :class="{on: labels.has(l.key)}"
                    :disabled="!allStats.byLabel[l.key]" @click="toggle(l.key)">
              {{ l.name }} <span class="chip-n">{{ allStats.byLabel[l.key] || 0 }}</span>
            </button>
          </div>
        </div>
        <p class="qm-body">Easiest first. ✓ right, ◐ partly, ✕ wrong, – not run; the three marks are Haiku, Sonnet, Opus.
          “Model-written” means a model wrote the question; open it to see the evidence it came from.</p>
        <template v-for="r in data.rungs" :key="r.n">
          <div v-if="byRung[r.n]?.length" class="lg">
            <span class="swatch" :style="{background: rungColors[r.n]}" /><b>{{ r.name }}</b>
            <span class="lg-n">{{ byRung[r.n].length }}</span>
          </div>
          <question-row v-for="q in byRung[r.n]" :key="q.id" :q="q" :rungs="data.rungs" :labels="data.labels" />
        </template>
        <template v-if="byRung.none?.length">
          <div class="lg"><b>Not rated yet</b><span class="lg-n">{{ byRung.none.length }}</span></div>
          <question-row v-for="q in byRung.none" :key="q.id" :q="q" :rungs="data.rungs" :labels="data.labels" />
        </template>
      </section>

      <section v-if="need.importance" class="qm-section">
        <h2>Evidence</h2>
        <p class="qm-body">{{ need.importance }}</p>
        <p v-if="need.see_also?.length" class="qm-body">See also:
          <template v-for="(s, i) in need.see_also" :key="s">
            <router-link v-if="data.needs[s]" :to="{name: 'QuestionMapNeed', params: {need: s}}">{{ data.needs[s].name }}</router-link>
            <span v-else>{{ s }}</span><span v-if="i < need.see_also.length - 1">, </span>
          </template>
        </p>
      </section>
    </template>
  </div>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import RungBar from '@/components/QuestionMap/RungBar.vue';
import QuestionRow from '@/components/QuestionMap/QuestionRow.vue';
import {ARMS, GAP_NAMES, RUNG_COLORS, askers, loadQuestionMap, num, pct, pinned, statsFor} from '@/questionMap';

defineOptions({name: 'QuestionMapNeed'});

const route = useRoute();
const data = ref(null);
const error = ref(null);
const arms = ARMS;
const rungColors = RUNG_COLORS;
const gapNames = GAP_NAMES;
const labels = ref(new Set());

const needId = computed(() => route.params.need);
const need = computed(() => data.value?.needs[needId.value]);
const branch = computed(() => data.value?.branchById[need.value?.branch]);
const node = computed(() => data.value?.nodeById[need.value?.node]);

function resetLabels() {
  const fromUrl = (route.query.sources || '').split(',').filter(Boolean);
  labels.value = new Set(fromUrl.length ? fromUrl : data.value.labels.map(l => l.key));
}

onMounted(async () => {
  try {
    data.value = await loadQuestionMap();
    resetLabels();
  } catch (e) {
    error.value = e.message;
  }
});
watch(needId, () => { if (data.value) resetLabels(); });

const all = computed(() => data.value?.byNeed[needId.value] || []);
const shown = computed(() => all.value.filter(q => labels.value.has(q.label)));
const allStats = computed(() => statsFor(all.value));
const stats = computed(() => statsFor(shown.value));
const pins = computed(() => pinned(shown.value));
const gapList = computed(() => Object.entries(stats.value.gaps).map(([code, n]) => ({code, n})).sort((a, b) => b.n - a.n));
const byRung = computed(() => {
  const g = {};
  for (const q of shown.value) (g[q.rung || 'none'] ||= []).push(q);
  return g;
});
const toggle = k => {
  const s = new Set(labels.value);
  s.has(k) ? s.delete(k) : s.add(k);
  labels.value = s;
};
</script>

<style scoped>
.qm { background: #fff; padding: 0 24px 80px; color: #0a0a0a; }
.qm-hero { max-width: 1000px; margin: 0 auto; padding: 48px 0 8px; }
.crumbs { display: flex; gap: 8px; flex-wrap: wrap; font-size: 13px; color: #71717a; margin-bottom: 16px; }
.crumbs a { color: #18181b; text-decoration: none; font-weight: 500; }
.crumbs a:hover { text-decoration: underline; }
.qm-hero h1 { font-size: 40px; font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 12px; }
.qm-lede { font-size: 18px; line-height: 1.6; color: #3f3f46; margin: 0 0 16px; }
.qm-msg { max-width: 1000px; margin: 48px auto; color: #52525b; font-size: 15px; }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px 24px; margin: 0; }
.facts dt { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #71717a; }
.facts dd { margin: 2px 0 0; font-size: 14px; color: #3f3f46; line-height: 1.5; }
.tiles { max-width: 1000px; margin: 24px auto 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.tile { border: 1px solid #ececee; border-radius: 12px; padding: 12px 14px; }
.tile-n { font-size: 26px; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.tile-l { font-size: 12.5px; color: #71717a; margin-top: 2px; line-height: 1.35; }
.qm-section { max-width: 1000px; margin: 36px auto 0; }
.qm-section h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 10px; }
.qm-section h3 { font-size: 15px; font-weight: 600; margin: 20px 0 8px; }
.qm-body { font-size: 14.5px; line-height: 1.6; color: #52525b; margin: 0 0 12px; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: #3f3f46; margin-top: 10px; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; }
.legend-item.zero { color: #c4c4c9; }
.swatch { display: inline-block; width: 11px; height: 11px; border-radius: 3px; flex-shrink: 0; }
.gap-row { display: grid; grid-template-columns: minmax(200px, 340px) 1fr 40px; gap: 12px; align-items: center; font-size: 14px; padding: 3px 0; }
.gap-bar { height: 8px; background: #f4f4f5; border-radius: 4px; overflow: hidden; }
.gap-bar span { display: block; height: 100%; background: #52525b; border-radius: 4px; }
.gap-n { text-align: right; color: #52525b; font-variant-numeric: tabular-nums; }
.pin { border: 1px solid #ececee; border-radius: 12px; padding: 8px 12px 0; margin-bottom: 14px; }
.pin-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin: 4px 4px 0; }
.pin-label.good { color: #0a7f0a; }
.pin-label.bad { color: #c23434; }
.pin :deep(.q:first-of-type) { border-top: 0; }
.list-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-size: 12.5px; padding: 3px 10px; border-radius: 999px; border: 1px solid #e4e4e7; background: #fff; color: #52525b; cursor: pointer; }
.chip.on { background: #18181b; border-color: #18181b; color: #fff; }
.chip:disabled { opacity: 0.35; cursor: default; }
.chip-n { opacity: 0.6; margin-left: 2px; }
.lg { display: flex; align-items: center; gap: 8px; padding: 18px 4px 6px; font-size: 14px; border-top: 1px solid #e4e4e7; }
.lg-n { margin-left: auto; color: #a1a1aa; font-size: 12.5px; }
@media (max-width: 760px) {
  .tiles { grid-template-columns: repeat(2, 1fr); }
  .gap-row { grid-template-columns: 1fr 60px 32px; }
}
</style>
