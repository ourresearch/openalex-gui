<template>
  <v-list-item
      :disabled="disabled"
      @click="isApplied = !isApplied"
  >
    <v-list-item-icon>
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title :class="{isNegated}">
        {{ displayValue }}
        {{ (disabled) ? "(applied)" : "" }}
      </v-list-item-title>
      <v-list-item-subtitle v-if="hint" style="white-space: normal;">
        <span v-if="myEntityConfig">{{ filters.capitalize(filters.pluralize(myEntityConfig.displayName, 1)) }} </span>
        <span v-if="hint"> {{ filters.truncate(hint, 100) }}</span>
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action-text class="body-1">
      <template v-if="isCountLoading">
        <v-progress-circular indeterminate size="10" width="2" color="grey"/>
      </template>
      <template>
        {{ filters.toPrecision(myCount) }}
      </template>
    </v-list-item-action-text>
  </v-list-item>
</template>

<script>

import {mapGetters} from "vuex";
import filters from '@/filters'
import {url} from "@/url";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "FilterSelectEditRow",
  components: {},
  props: {
    filterKey: String,
    filterIndex: Number,
    value: String,
    displayValue: String,
    count: Number || null,
    disabled: Boolean,
    hint: String,
    isFromAutocomplete: Boolean,
  },
  data() {
    return {
      myCount: this.count,
      isCountLoading: false,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    myConfig(){
      return getFacetConfig(this.entityType, this.filterKey)
    },
    myEntityConfig(){
      return getEntityConfig(this.myConfig?.entityId)
    },
    valueId() {
      return this.value.replace("!", "")
    },
    index() {
      return url.findFilterIndex(this.$route, this.entityType, this.filterKey, this.value)
    },
    isApplied: {
      get() {
        return url.isFilterOptionApplied(this.$route, this.entityType, this.filterKey, this.value)
      },
      set(to) {
        if (this.filterIndex >= 0){
          console.log("FilterSelectEditRow set()", this.filterIndex)
          to ? url.addFilterOption(this.entityType, this.filterIndex, this.value) :
              url.deleteFilterOption(this.entityType, this.filterIndex, this.value)
        }
        else {
          to ? url.createFilter(this.entityType, this.filterKey, this.value) :
               url.deleteFilterOptionByKey(this.entityType, this.filterKey, this.value)
        }
      }
    },
    isNegated() {
      return url.readIsFilterNegated(this.$route, this.entityType, this.index)
    }
  },
  methods: {
    async getMyCount() {
      if (!this.isFromAutocomplete) return
      this.isCountLoading = true
      this.myCount = undefined
      const filters = url.upsertFilterOptionNoPush(this.entityType, this.filterKey, this.value)
      const count = await api.getResultsCount(this.entityType, filters)
      this.myCount = count
      this.isCountLoading = false
    },
  },
  watch: {
    "$route.query.filter": {
      immediate: true,
      handler(to, from) {
        this.getMyCount()
      }
    },
  }
}
</script>


<style scoped lang="scss">
.isNegated {
  text-decoration: line-through !important;
}
.v-list-item__icon {
  margin: 0;
  align-self: normal;
}
.group-by-table-row {
  cursor: pointer;

  &:hover {
    //background: $color-2;
  }
}
</style>