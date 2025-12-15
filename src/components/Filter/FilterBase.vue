<template>
  <tr
    @click="emit('click')"
    class="hover:bg-accent font-normal"
    :class="{
      'cursor-pointer': clickable, 
      'flex border-y border-border items-center': smAndDown
    }"
  >
    <td class="text-muted-foreground whitespace-nowrap w-px pl-5 hidden md:table-cell">
      <Hash class="h-4 w-4 inline" />{{ index + 1 }}
    </td>
    <td class="text-muted-foreground whitespace-nowrap w-px hidden md:table-cell">
      {{ index > 0 ? "and" : "" }}
    </td>

    <template v-if="mdAndUp">
      <td class="whitespace-nowrap w-px items-center pl-4">
        <component :is="getIconComponent(myConfig.icon)" class="h-4 w-4 mr-2 mb-1 text-muted-foreground inline" />
        {{ filters.titleCase(myFilterName) }}
      </td>
      <td class="whitespace-nowrap w-px pr-6 text-center" style="min-width: 5em;">
        <filter-verb
          :is-negated="isNegated"
          :value="myValue"
          :filter-key="filterKey"
          :type="myConfig?.type"
          @set="(val) => isNegated = val"
        />
      </td>
      <td>
        <slot></slot>
      </td>
      <td class="text-right">
        <Button variant="ghost" size="icon" class="mr-2" @click.stop="emit('add-option')" v-if="myConfig.type === 'select'">
          <Plus class="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" @click.stop="url.deleteFilter(entityType, index)">
          <X class="h-4 w-4" />
        </Button>
      </td>
    </template>
    <template v-else>
      <div class="w-full p-3">
        <div class="flex items-center">
          <component :is="getIconComponent(myConfig.icon)" class="h-4 w-4 mr-2 mb-1" />
          <div class="mr-2">
            {{ myFilterName}}
          </div>
          <filter-verb
            :is-negated="isNegated"
            :value="myValue"
            :type="myConfig?.type"
            @set="(val) => isNegated = val"
          />
          <div class="flex-1" />

          <Button variant="ghost" size="icon" @click.stop="url.deleteFilter(entityType, index)">
            <X class="h-4 w-4" />
          </Button>
        </div>
        <div class="ml-3">
          <slot></slot>
          <Button variant="ghost" size="sm" class="ml-2 mt-2" @click.stop="$emit('add-option')" v-if="myConfig.type === 'select'">
            <Plus class="h-4 w-4 mr-1" /> add {{ myConfig.displayName }}
          </Button>
        </div>
      </div>
    </template>
  </tr>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useBreakpoints } from '@/composables/useBreakpoints';

import { Hash, Plus, X, FileText, Users, BookOpen, Building2, Landmark, Lightbulb, MapPin, Award, DollarSign, Calendar, BarChart3 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { getFacetConfig } from '@/facetConfigs';
import { url } from '@/url';
import filters from '@/filters';
import FilterVerb from '@/components/Filter/FilterVerb.vue';

defineOptions({name: "FilterBase"});

const iconMap = {
  'mdi-file-document-outline': FileText,
  'mdi-account-outline': Users,
  'mdi-book-open-page-variant-outline': BookOpen,
  'mdi-domain': Building2,
  'mdi-town-hall': Landmark,
  'mdi-lightbulb-outline': Lightbulb,
  'mdi-map-marker-outline': MapPin,
  'mdi-trophy-outline': Award,
  'mdi-cash-multiple': DollarSign,
  'mdi-calendar': Calendar,
  'mdi-chart-bar': BarChart3,
};

function getIconComponent(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

const {filterKey, index, clickable} = defineProps({
  filterKey: String,
  index: Number,
  clickable: Boolean
});

const emit = defineEmits(['click', 'add-option']);

const route = useRoute();
const store = useStore();

const { smAndDown, mdAndUp } = useBreakpoints();

const entityType = computed(() => store.getters.entityType);
const myConfig = computed(() => getFacetConfig(entityType.value, filterKey));

const myFilterName = computed(() => {
  return myConfig.value.type === 'boolean'
    ? filters.pluralize(entityType.value, 1)
    : myConfig.value.displayName;
});

const myValue = computed(() =>
  url.readFilterValue(route, entityType.value, index)
);

const isNegated = computed({
  get() {
    if (myConfig.value.type === 'boolean') {
      const val = url.readFilter(route, entityType.value, index)?.value;
      return !val;
    } else {
      return url.readIsFilterNegated(route, entityType.value, index);
    }
  },
  set(to) {
    console.log('isNegated setter()', to);
    if (myConfig.value.type === 'boolean') {
      url.updateFilter(entityType.value, index, !to);
    } else {
      url.setIsFilterNegated(entityType.value, index, to);
    }
  }
});
</script>


<style scoped>
td {
  padding: 10px 9px;
  border-bottom: 1px solid hsl(var(--border));
}
</style>