<template>
  <div v-if="bannerKind === 'offer-select-all'" class="selection-banner">
    <span>
      All {{ loadedCount }} on this page selected.
      <a class="banner-link" @click="enterSelectAll">Select all {{ formattedTotal }}.</a>
    </span>
  </div>
  <div v-else-if="bannerKind === 'in-select-all'" class="selection-banner">
    <span>
      All {{ formattedSelectedCount }} items selected.
      <a class="banner-link" @click="clearSelection">Clear selection.</a>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import filters from '@/filters';

defineOptions({ name: 'SelectionBanner' });

const store = useStore();

const bannerKind = computed(() => store.getters['selection/bannerKind']);
const selectedCount = computed(() => store.getters['selection/selectedCount']);
const loadedCount = computed(() => store.state.selection.loadedIds.length);
const totalCount = computed(() => store.state.selection.totalCount);

const formattedTotal = computed(() => filters.toPrecision(totalCount.value));
const formattedSelectedCount = computed(() => filters.toPrecision(selectedCount.value));

function enterSelectAll() {
  store.commit('selection/enterSelectAllMode');
}
function clearSelection() {
  store.commit('selection/deselectAll');
}
</script>

<style scoped>
.selection-banner {
  background: rgba(25, 118, 210, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.72);
  padding: 8px 16px;
}
.banner-link {
  color: rgb(25, 118, 210);
  cursor: pointer;
  font-weight: 500;
}
.banner-link:hover {
  text-decoration: underline;
}
</style>
