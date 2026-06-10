<template>
  <!-- Flag-on SERP layout (oxjob #440): a narrow single-column group-by rail on
       the left + a multi-mode input column on the right. Desktop-first; on small
       screens the rail stacks above the input column. Flag-OFF uses ExpertSerp. -->
  <div class="oql-serp" :class="{ 'oql-serp--stacked': !mdAndUp }">
    <group-by-sidebar v-if="!isSemanticSearch" :results-object="resultsObject" />
    <div class="oql-serp-main">
      <serp-input-container :results-object="resultsObject" :search-error="searchError" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

import GroupBySidebar from '@/components/GroupBySidebar.vue';
import SerpInputContainer from '@/components/Serp/SerpInputContainer.vue';

defineOptions({ name: 'OqlSerp' });

defineProps({
  resultsObject: Object,
  searchError: String,
});

const route = useRoute();
const { mdAndUp } = useDisplay();
// Semantic search doesn't support faceting, so hide the stats rail (same rule as
// today's ExpertSerp right column).
const isSemanticSearch = computed(() => !!route.query['search.semantic']);
</script>

<style scoped>
.oql-serp {
  display: flex;
  align-items: flex-start;
  min-height: 80vh;
}
.oql-serp-main {
  flex: 1 1 auto;
  min-width: 0;
  padding: 14px 24px 0;
}
/* Mobile / narrow: stack the rail above the input column (follow-up job will
   refine mobile; desktop-first here). */
.oql-serp--stacked {
  flex-direction: column;
}
.oql-serp--stacked :deep(.group-by-sidebar) {
  width: 100%;
  flex: 1 1 auto;
  border-right: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
