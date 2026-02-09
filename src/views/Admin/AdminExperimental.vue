<template>
  <div class="settings-page">
    <div class="settings-page-title">Experimental</div>
    <p class="text-body-2 text-grey-darken-1 mb-6">
      Session-only feature flags for testing. These reset when you reload the page.
    </p>

    <div class="d-flex align-center justify-space-between py-3" style="border-bottom: 1px solid #E5E5E5;">
      <div>
        <div class="text-body-2 font-weight-medium">New search parameters</div>
        <div class="text-caption text-grey-darken-1">
          Use top-level <code>search</code>, <code>search.exact</code>, and <code>search.semantic</code> params instead of filter-based search.
        </div>
      </div>
      <v-switch
        :model-value="featureFlags.newSearch"
        @update:model-value="toggleNewSearch"
        color="primary"
        hide-details
        density="compact"
      />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminExperimental' });

import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const featureFlags = computed(() => store.getters.featureFlags);

function toggleNewSearch(value) {
  store.commit('setFeatureFlag', { flag: 'newSearch', value });
}
</script>
