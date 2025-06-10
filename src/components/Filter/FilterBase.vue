<template>
  <tr
    @click="$emit('click')"
    class="hover-color-3 font-weight-regular"
    :class="{clickable, card: $vuetify.display.smAndDown}"
  >
    <td class="text-grey shrink pl-5 d-none d-md-table-cell">
      <v-icon>mdi-numeric-{{ index + 1 }}-circle</v-icon>
    </td>
    <td class="text-grey shrink d-none d-md-table-cell">
      {{ index > 0 ? "and" : "" }}
    </td>

    <template v-if="$vuetify.display.mdAndUp">
      <td class="shrink align-center pl-4">
        <v-icon class="mr-2 mb-1 text-medium-emphasis">{{ myConfig.icon }}</v-icon>
        {{ filters.titleCase(myFilterName) }}
      </td>
      <td class="shrink pr-6" style="min-width: 5em; text-align: center;">
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
        <v-btn icon variant="plain" size="medium" class="mr-2" @click.stop="$emit('add-option')" v-if="myConfig.type === 'select'">
          <v-icon>mdi-plus-thick</v-icon>
        </v-btn>
        <v-btn icon variant="plain" size="medium" @click.stop="url.deleteFilter(entityType, index)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </td>
    </template>
    <template v-else>
      <div style="width: 100%;" class="pa-3">
        <div class="d-flex align-center">
          <v-icon class="mr-2 mb-1">{{ myConfig.icon }}</v-icon>
          <div>
            {{ myFilterName}}
          </div>
          <v-spacer />
          <filter-verb
              :is-negated="isNegated"
              :value="myValue"
              :type="myConfig?.type"
              @set="(val) => isNegated = val"
          />

          <v-btn icon @click.stop="url.deleteFilter(entityType, index)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="ml-3">
          <slot></slot>
          <v-btn size="small" rounded class="ml-2 mt-2" @click.stop="$emit('add-option')" v-if="myConfig.type === 'select'">
            <v-icon start>mdi-plus-thick</v-icon> add {{ myConfig.displayName }}
          </v-btn>
        </div>
      </div>
    </template>
  </tr>
</template>

<script>

import {mapGetters} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";
import filters from "@/filters";
import FilterVerb from "@/components/Filter/FilterVerb.vue";

export default {
  name: "FilterBase",
  components: {
    FilterVerb,
  },
  props: {
    filterKey: String,
    index: Number,
    clickable: Boolean,
  },
  data() {
    return {
      url,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    myConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    myFilterName(){
      if (this.myConfig.type === "boolean") {
        return filters.pluralize(this.entityType, 1)
      }
      else {
        return this.myConfig.displayName
      }
    },
    myValue() {
      return url.readFilterValue(this.$route, this.entityType, this.index)
    },
    isNegated: {
      get() {
        return this.myConfig.type === "boolean" ?
            !url.readFilter(this.$route, this.entityType, this.index)?.value :
            url.readIsFilterNegated(this.$route, this.entityType, this.index)
      },
      set(to) {
        console.log("isNegated setter()", to)
        return this.myConfig.type === "boolean" ?
            url.updateFilter(this.entityType, this.index, !to) :
            url.setIsFilterNegated(this.entityType, this.index, to)
      }
    }
  },
  methods: {
  },
}
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
  padding: 10px 9px;
  border-bottom: 1px solid #eee;
}

td.shrink {
  white-space: nowrap;
  width: 1px;
}

</style>