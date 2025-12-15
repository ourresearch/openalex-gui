<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Badge 
        :class="['cursor-pointer', {'font-normal text-base min-w-7': buttonName === 'none'}]" 
        :variant="buttonColor === 'catWorks' ? 'default' : 'secondary'"
      >
        <span v-if="uiVariant === 'sentence-group' && subjectEntity === null">
          <Layers class="h-4 w-4" />
        </span>
        <span v-else class="flex items-center">
          {{ buttonName }}
          <X v-if="uiVariant === 'sentence-group'" class="h-3 w-3 ml-1 -mr-1" @click.stop.prevent="() => {selected = 'works'; }" />
          <ChevronDown v-else class="h-4 w-4 ml-1 -mr-1" />
        </span>
      </Badge>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="max-h-[70vh] overflow-y-auto">
      <DropdownMenuItem
        v-if="uiVariant !== 'sentence-group'"
        @click="selected = 'works'"
      >
        <FileText class="h-4 w-4 mr-2" />
        {{ uiVariant === 'worksfirst' ? 'none' : 'Works' }}
        <Check v-if="selected === 'works'" class="h-4 w-4 ml-auto" />
      </DropdownMenuItem>

      <DropdownMenuLabel>Group works by:</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <DropdownMenuItem
        v-for="entity in popularEntities"
        :key="entity.id"
        @click="selected = entity.id"
      >
        <component :is="getIcon(entity.icon)" class="h-4 w-4 mr-2" />
        <span class="capitalize">{{ entity.displayName }}</span>
        <Check v-if="selected === entity.id" class="h-4 w-4 ml-auto" />
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        v-for="entity in remainingEntitiesSorted"
        :key="entity.id"
        @click="selected = entity.id"
      >
        <component :is="getIcon(entity.icon)" class="h-4 w-4 mr-2" />
        <span class="capitalize">{{ entity.displayName }}</span>
        <Check v-if="selected === entity.id" class="h-4 w-4 ml-auto" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { Layers, X, ChevronDown, FileText, Check, Users, Building, DollarSign, Lightbulb, BookOpen, Globe, Tag } from 'lucide-vue-next';

import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

import filters from '@/filters';
import { getConfigs } from '@/oaxConfigs';

// Map mdi icons to lucide icons
const iconMap = {
  'mdi-file-document': FileText,
  'mdi-file-document-outline': FileText,
  'mdi-account-group': Users,
  'mdi-domain': Building,
  'mdi-currency-usd': DollarSign,
  'mdi-lightbulb': Lightbulb,
  'mdi-book-open-variant': BookOpen,
  'mdi-web': Globe,
  'mdi-tag': Tag,
};

function getIcon(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

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