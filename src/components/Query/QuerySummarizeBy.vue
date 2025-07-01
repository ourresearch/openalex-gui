<template>
  <v-menu height="70vh" class="rounded-lg" transition="none" location="bottom">
    <template v-slot:activator="{ props }">
      <v-chip label :class="['entity-chip', {'none': buttonName === 'none'}]" variant="flat" :color="buttonColor" v-bind="props">
        <span v-if="uiVariant === 'sentence-group' && subjectEntity === null">
            <v-icon size="small">mdi-layers-triple-outline</v-icon>
          </span>
        <span v-else>
          {{ buttonName }}
          <v-icon v-if="uiVariant === 'sentence-group'" class="down-icon" size="small" @click.stop.prevent="() => {selected = 'works'; }">mdi-close</v-icon>
          <v-icon v-else class="down-icon" end>mdi-menu-down</v-icon>
        </span>
      </v-chip>
    </template>

    <v-list>
        <v-list-item
          :active="selected === 'works'"
          @click="selected = 'works'"
          active-class="primary--text"
          v-if="uiVariant !== 'sentence-group'"
        >
          <template #prepend>
            <v-icon>mdi-file-document-outline</v-icon>
          </template>
          <v-list-item-title>{{uiVariant === 'worksfirst' ? 'none' : 'Works'}}</v-list-item-title>
        </v-list-item>

        <v-list-subheader>Group works by:</v-list-subheader>
        <v-divider/>
        <!-- Show popular entities first -->
        <v-list-item
          v-for="entity in popularEntities"
          :key="entity.id"
          :active="selected === entity.id"
          @click="selected = entity.id"
          active-class="primary--text"
        >
          <template #prepend>
            <v-icon>{{ entity.icon }}</v-icon>
          </template>
          <v-list-item-title class="text-capitalize">{{ entity.displayName }}</v-list-item-title>
          <v-icon v-if="selected === entity.id">mdi-check</v-icon>
        </v-list-item>

        <v-divider/>

        <!-- Remaining entities in alphabetical order -->
        <v-list-item
          v-for="entity in remainingEntitiesSorted"
          :key="entity.id"
          :active="selected === entity.id"
          @click="selected = entity.id"
          active-class="primary--text"
        >
          <template #prepend>
            <v-icon>{{ entity.icon }}</v-icon>
          </template>
          <v-list-item-title class="text-capitalize">{{ entity.displayName }}</v-list-item-title>
          <v-icon v-if="selected === entity.id">mdi-check</v-icon>
        </v-list-item>
    </v-list>
  </v-menu>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import filters from '@/filters';
import { getConfigs } from '@/oaxConfigs';

defineOptions({ name: 'QuerySummarizeBy' });

const props = defineProps({
  subjectEntity: {
    type: String,
    default: null,
  },
});

const store = useStore();

const uiVariant = computed(() => store.getters['uiVariant']);
const query = computed(() => store.getters['search/query']);

const setSummarize = (val) => store.commit('search/setSummarize', val);
const createSearch = () => store.dispatch('search/createSearch');

function getEntityConfig(entityId) {
  const configs = getConfigs();
  return configs[entityId] || null;
}

const entities = computed(() => {
  return Object.values(getConfigs()).filter(config => config.id !== 'works');
});

const popularEntities = computed(() => {
  const summaryConfig = {
    id: 'summary',
    displayName: 'Works Summary',
    icon: 'mdi-file-document',
  };

  const popularIds = ['authors', 'institutions', 'funders', 'topics'];
  const mapped = popularIds
    .map(id => getEntityConfig(id))
    .filter(entity => entity !== null);

  mapped.push(summaryConfig);
  return mapped;
});

const remainingEntitiesSorted = computed(() => {
  const popularIds = ['authors', 'institutions', 'funders', 'topics'];
  return entities.value
    .filter(entity => !popularIds.includes(entity.id) && entity.id !== 'works' && entity.id !== 'summary')
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
});

const buttonName = computed(() => {
  const entity = query.value.get_rows;
  if (entity === 'summary') {
    return 'Works Summary';
  }
  const name = getConfigs()[entity].displayName;
  if (
    ['sentence-group', 'sentence-worksfirst', 'worksfirst'].includes(uiVariant.value) &&
    name === 'works'
  ) {
    return 'none';
  }
  return filters.titleCase(name);
});

const buttonColor = computed(() => {
  if (uiVariant.value === 'sentence-group') {
    if (props.subjectEntity === null) {
      return 'catEntity';
    }
    return ['works', 'summary'].includes(query.value.get_rows) ? 'catWorks' : 'catEntity';
  }
  if (props.subjectEntity === null) {
    return 'catEntity';
  }
  if (['worksfirst'].includes(uiVariant.value)) {
    return 'catEntity';
  }
  return ['works', 'summary'].includes(query.value.get_rows) ? 'catWorks' : 'catEntity';
});

const selected = computed({
  get() {
    return query.value.summarize;
  },
  set(value) {
    console.log('setSummarize', value);
    setSummarize(value);
    if (uiVariant.value === 'sentence-group') {
      createSearch();
    }
  },
});
</script>


<style scoped lang="scss">
.query-summarize-by-button {
  padding-right: 4px;
}
.down-icon {
  margin-left: -2px !important; 
}
.entity-chip.none {
  font-weight: normal;
  font-size: 16px !important;
  min-width: 28px;
}
</style>