<template>
  <div>
    <div class="selection-toolbar d-flex align-center">
      <v-checkbox-btn
        class="master-checkbox"
        density="compact"
        :model-value="masterChecked"
        :indeterminate="masterIndeterminate"
        :disabled="disableMaster"
        @update:model-value="onMasterClick"
      />
      <slot name="trailing" />
    </div>
    <div v-if="!disableMaster && bannerKind === 'offer-select-all'" class="selection-banner">
      <span>
        All {{ loadedCount }} on this page selected.
        <a class="banner-link" @click="enterSelectAll">Select all {{ formattedTotal }}.</a>
      </span>
    </div>
    <div v-else-if="!disableMaster && bannerKind === 'in-select-all'" class="selection-banner">
      <span>
        All {{ formattedSelectedCount }} items selected.
        <a class="banner-link" @click="clearSelection">Clear selection.</a>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import filters from '@/filters';

defineOptions({ name: 'SelectionToolbar' });

defineProps({
  disableMaster: { type: Boolean, default: false },
});

const store = useStore();

const masterState = computed(() => store.getters['selection/masterState']);
const bannerKind = computed(() => store.getters['selection/bannerKind']);
const selectedCount = computed(() => store.getters['selection/selectedCount']);
const loadedCount = computed(() => store.state.selection.loadedIds.length);
const totalCount = computed(() => store.state.selection.totalCount);

const masterChecked = computed(() =>
  masterState.value === 'all-loaded' || masterState.value === 'all-set'
);
const masterIndeterminate = computed(() => masterState.value === 'some');

const formattedTotal = computed(() => filters.toPrecision(totalCount.value));
const formattedSelectedCount = computed(() => filters.toPrecision(selectedCount.value));

function onMasterClick() {
  if (masterState.value === 'none') {
    store.commit('selection/selectAllOnPage');
  } else {
    store.commit('selection/deselectAll');
  }
}

function enterSelectAll() {
  store.commit('selection/enterSelectAllMode');
}

function clearSelection() {
  store.commit('selection/deselectAll');
}
</script>

<style scoped>
.selection-toolbar {
  padding: 4px 12px;
  min-height: 48px;
}
.master-checkbox {
  flex: 0 0 auto;
  width: auto;
  margin-left: -4px;
}
.selection-banner {
  background: rgba(25, 118, 210, 0.06);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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
