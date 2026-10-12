<template>
  <!-- oxjob #1659: a search pasted from another database opens here translated; this box says from where and lists
       every difference, each linked to its section of the help page. Shown only while the query is the translation. -->
  <div v-if="entry" class="db-search-notes text-body-2 mb-4" role="note">
    <div class="d-flex align-center flex-wrap ga-2">
      <v-icon size="18" color="primary">mdi-swap-horizontal</v-icon>
      <span class="font-weight-medium">Translated from {{ entry.sourceLabel }}.</span>
      <span class="text-medium-emphasis">{{ summaryLine }}</span>
      <v-spacer />
      <v-btn
        size="small"
        variant="text"
        class="text-none"
        :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        @click="copyForMethods"
      >{{ copied ? 'Copied' : 'Copy for your methods' }}</v-btn>
    </div>
    <ul v-if="entry.changes.length" class="db-search-changes mt-2">
      <li v-for="(c, i) in entry.changes" :key="i">
        <code class="db-search-original">{{ c.original }}</code>
        {{ `→ ${c.result}. ` }}<span class="text-medium-emphasis">{{ sentence(c.why) }}</span>
        {{ ' ' }}<a :href="`${helpUrl}#${c.ref}`" target="_blank" rel="noopener">More</a>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineOptions({ name: 'DbSearchNotes' });

import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { recallTranslation } from '@/dbSearchNotes';
import { DB_SEARCH_HELP_URL, methodsText } from '@/dbSearchTranslate';

const route = useRoute();
const helpUrl = DB_SEARCH_HELP_URL;
const copied = ref(false);

const entry = computed(() => recallTranslation(route.query.oql));

const summaryLine = computed(() => {
  const n = entry.value?.changes.length || 0;
  if (!n) return 'No differences to note.';
  return n === 1 ? 'One difference:' : `${n} differences:`;
});

function sentence(s) {
  if (!s) return '';
  const t = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

async function copyForMethods() {
  const e = entry.value;
  if (!e) return;
  const text = methodsText({ sourceLabel: e.sourceLabel, oql: e.oql, changes: e.changes }, e.original, new Date(e.at));
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (err) {
    console.warn('copy failed', err);
  }
}
</script>

<style scoped>
.db-search-notes {
  border: 1px solid rgba(var(--v-theme-primary), 0.35);
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.04);
  padding: 12px 16px;
}
.db-search-changes {
  margin: 0;
  padding-left: 20px;
}
.db-search-changes li + li {
  margin-top: 4px;
}
.db-search-original {
  font-size: 0.85em;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 3px;
  word-break: break-word;
}
</style>
