<template>
  <div class="settings-page">
    <div class="settings-page-title">Experimental</div>
    <p class="text-body-2 text-grey-darken-1 mb-6">
      Feature flags for testing upcoming features. Persisted in localStorage.
    </p>

    <div class="d-flex align-center justify-space-between py-3" style="border-bottom: 1px solid #E5E5E5;">
      <div>
        <div class="text-body-2 font-weight-medium">Alice Features</div>
        <div class="text-caption text-grey-darken-1">
          Enable all Alice release features: new search parameters, credit usage UI, and redesigned plan page.
        </div>
      </div>
      <v-switch
        :model-value="featureFlags.aliceFeatures"
        @update:model-value="toggleAliceFeatures"
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

function toggleAliceFeatures(value) {
  store.commit('setFeatureFlag', { flag: 'aliceFeatures', value });
}
</script>
