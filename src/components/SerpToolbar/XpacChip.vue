<template>
  <v-tooltip location="bottom">
    <template v-slot:activator="{ props }">
      <v-chip
        v-bind="props"
        @click="toggleXpac"
        :variant="isXpacEnabled ? 'flat' : 'text'"
        :color="isXpacEnabled ? 'primary' : 'default'"
        :prepend-icon="isXpacEnabled ? 'mdi-check' : undefined"
        class="xpac-chip"
      >
        xpac
      </v-chip>
    </template>
    <span>
      Include 'expansion pack' works. Better coverage (192M new works from DataCite and repositories), but data quality is lower.
    </span>
  </v-tooltip>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { url } from '@/url';

defineOptions({ name: 'XpacChip' });

const route = useRoute();
const router = useRouter();

const isXpacEnabled = computed(() => route.query.include_xpac === 'true');

function toggleXpac() {
  const newQuery = { ...route.query };
  
  if (isXpacEnabled.value) {
    // Remove the param
    delete newQuery.include_xpac;
  } else {
    // Add the param
    newQuery.include_xpac = 'true';
  }
  
  url.pushToRoute(router, {
    name: route.name,
    params: route.params,
    query: newQuery,
  });
}
</script>

<style scoped>
.xpac-chip {
  cursor: pointer;
  margin-right: 8px;
}

:deep(.v-overlay__content) {
  max-width: 300px !important;
}
</style>
