<template>
  <tr
    @click="emit('click')"
    class="hover-color-3 font-weight-regular"
    :class="{clickable, card: smAndDown}"
  >
    <template v-if="mdAndUp">
      <td class="shrink align-center pl-4 text-body-2">
        <v-icon class="mr-2 mb-1 text-medium-emphasis">{{ myConfig.icon }}</v-icon>
        {{ filters.titleCase(myFilterName) }}
      </td>
      <td class="shrink pr-4 text-body-2" style="min-width: 4em; text-align: center;">
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
        <v-btn icon variant="plain" size="medium" @click.stop="url.deleteFilter(entityType, index)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </td>
    </template>
    <template v-else>
      <div style="width: 100%;" class="pa-3">
        <div class="d-flex align-center">
          <v-icon class="mr-2 mb-1">{{ myConfig.icon }}</v-icon>
          <div class="mr-2">
            {{ myFilterName}}
          </div>
          <filter-verb
            :is-negated="isNegated"
            :value="myValue"
            :type="myConfig?.type"
            @set="(val) => isNegated = val"
          />
          <v-spacer />

          <v-btn icon variant="plain" size="medium" @click.stop="url.deleteFilter(entityType, index)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="ml-3">
          <slot></slot>
        </div>
      </div>
    </template>
  </tr>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

import { getFacetConfig } from '@/facetConfigUtils';
import { url } from '@/url';
import filters from '@/filters';
import FilterVerb from '@/components/Filter/FilterVerb.vue';

defineOptions({name: "FilterBase"});

const {filterKey, index, clickable} = defineProps({
  filterKey: String,
  index: Number,
  clickable: Boolean
});

const emit = defineEmits(['click', 'add-option']);

const route = useRoute();
const store = useStore();

const { smAndDown, mdAndUp } = useDisplay();

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

    if (myConfig.value.type === 'boolean') {
      url.updateFilter(entityType.value, index, !to);
    } else {
      url.setIsFilterNegated(entityType.value, index, to);
    }
  }
});
</script>


<style scoped lang="scss">
tr {
  &.clickable {
    cursor: pointer;
  }

  &.card {
    display: flex;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    align-items: center;
    align-content: center;
    td {
      display: block;

    }
  }
}

td {
  padding: 6px 6px;
  border-bottom: 1px solid #eee;
}

td.shrink {
  white-space: nowrap;
  width: 1px;
}

</style>