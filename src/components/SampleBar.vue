<template>
  <v-card v-if="isSampling" variant="outlined" class="sample-bar d-flex align-center px-4 py-2 mb-3 bg-white">
    <v-icon class="mr-2" size="small">mdi-dice-multiple-outline</v-icon>
    <span class="sample-text">
      Sample
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            class="sample-size-btn mx-2"
            size="small"
          >
            {{ currentSampleSize }}
            <v-icon size="small" end>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="size in url.sampleSizes"
            :key="size"
            @click="url.setSample(size)"
            :class="{ 'v-list-item--active': size === currentSampleSize }"
          >
            <v-list-item-title>{{ size }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      Random Works
    </span>
    <v-spacer />
    <v-btn
      variant="text"
      size="small"
      @click="url.setSample(null)"
    >
      Stop sampling
    </v-btn>
    <v-menu location="bottom">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          size="small"
          variant="text"
        >
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item @click="copyIds">
          <template #prepend>
            <v-icon size="small">mdi-content-copy</v-icon>
          </template>
          <v-list-item-title>Copy IDs</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';

defineOptions({ name: 'SampleBar' });

const props = defineProps({
  resultsObject: Object,
});

const route = useRoute();
const store = useStore();

const isSampling = computed(() => url.isSampling(route));
const currentSampleSize = computed(() => url.getSample(route));

const snackbar = (msg) => store.commit('snackbar', msg);

async function copyIds() {
  const results = props.resultsObject?.results || [];
  const ids = results.map(r => r.id).join('\r\n');
  await navigator.clipboard.writeText(ids);
  snackbar(`${results.length} IDs copied to clipboard.`);
}
</script>

<style scoped lang="scss">
.sample-bar {
  font-size: 13px;
  color: #1A1A1A;
}

.sample-text {
  display: flex;
  align-items: center;
}
</style>
