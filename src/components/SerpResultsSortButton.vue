<template>
  <v-menu>
    <template v-slot:activator="{props}">
      <v-btn v-bind="props" icon>
        <v-icon color="grey-darken-1">mdi-sort-ascending</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-subheader>
        Sort by:
      </v-list-subheader>
      <v-divider/>
      <v-list-item
        v-for="option in menuOptions"
        :key="option.key"
        color="primary"
        @click="clickOption(option.key)"
        :disabled="menuOptions.length === 1"
      >
        <template #prepend>
          <v-icon :disabled="menuOptions.length === 1">{{ option.icon }}</v-icon>
        </template>
        
        <v-list-item-title>
          {{ option.displayName }}
        </v-list-item-title>
        
        <template #append>
          <v-icon v-if="selectedOption === option.key">mdi-check</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>


<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { facetConfigs } from '@/facetConfigs';
import { url } from '@/url';

defineOptions({ name: 'SerpResultsSortButton' });

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);
const isAdmin = computed(() => store.getters['user/isAdmin']);

// Computed: selected option
const selectedOption = computed(() => {
  return url.getSort(route);
});

// Computed: sort options
const popularOptions = computed(() => {
  const optionsFromConfigs = facetConfigs(entityType.value)
    .filter(conf => conf.actionsPopular?.includes('sort'))
    .filter(conf => !conf.requiresApiKey || isAdmin.value);

  if (url.isSearchFilterApplied(route)) {
    optionsFromConfigs.unshift({
      key: 'relevance_score',
      icon: 'mdi-magnify',
      displayName: 'relevance score'
    });
  }

  return optionsFromConfigs;
});

const menuOptions = computed(() => popularOptions.value);

// Methods
function clickOption(key) {
  url.setSort(key);
}
</script>


<style scoped lang="scss">

</style>