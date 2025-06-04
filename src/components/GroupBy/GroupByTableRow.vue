<template>
  <tr @click="clickRow" class="group-by-table-row hover-color-2">
    <td v-if="!hideCheckbox" class="pr-0" style="width: 1px; white-space: nowrap">
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </td>

    <td class="text-body-2" :class="{isNegated}">
      {{ displayValue }}
    </td>
    <td class="range text-body-2 text-right align-baseline">
      {{ filters.toPrecision(myCount) }}
    </td>
  </tr>
</template>

<script>

import {mapGetters} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import filters from '@/filters';
import {createSimpleFilter, filtersFromUrlStr, setStringIsNegated} from "@/filterConfigs";
import {getEntityConfig} from "@/entityConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    filterKey: String,
    value: String,
    displayValue: String,
    count: Number || null,
    hideCheckbox: Boolean,
  },
  data() {
    return {
      isMenuOpen: false,
      myCount: this.count,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    valueId() {
      return this.value.replace("!", "")
    },
    index() {
      return url.findFilterIndex(this.$route, this.entityType, this.filterKey, this.value)
    },
    isApplied: {
      get() {
        if (this.$route.name === 'EntityPage') return false // there are no filters set on the entity page
        return url.isFilterOptionApplied(this.$route, this.entityType, this.filterKey, this.value)
      },
      set(to) {
        console.log("GroupByTableRow isApplied.set()", to)
        if (to) {
          if (this.$route.name === 'EntityPage') {
            console.log("clicking on GroupByTableRow from entity page")
            const myEntityType = this.$route.params.entityType
            const myEntityId = this.$route.params.entityId
            const myEntityConfig = getEntityConfig(myEntityType)
            const myEntityWorksFilter = createSimpleFilter(
                "works",
                myEntityConfig.filterKey,
                myEntityId,
            )
            const myRowFilter = createSimpleFilter(
                "works",
                this.filterKey,
                this.value
            )
            url.pushNewFilters([myEntityWorksFilter, myRowFilter], "works")
          } else {
            url.createFilter(this.entityType, this.filterKey, this.value)
          }
        } else {
          url.deleteFilterOptionByKey(this.entityType, this.filterKey, this.value)
        }
      }
    },
    isNegated: {
      get() {
        return url.readIsFilterNegated(this.$route, this.entityType, this.index)
      },
      set(to) {
        const newValue = setStringIsNegated(this.value, to)
        this.index >= 0 ?
            url.setIsFilterOptionNegated(this.entityType, this.filterKey, this.value, to) :
            url.createFilter(this.entityType, this.filterKey, newValue)

      }
    },
    doesMyFilterHaveOtherOptions() {
      return url.readFilterOptions(this.$route, this.entityType, this.index)?.length > 1
    },
  },
  methods: {
    clickRow() {
      console.log("GroupByTableRow clickRow()")
      this.isApplied = !this.isApplied
    },
    async getMyCount() {
      if (this.count !== null) {
        this.myCount = this.count
        return
      }
      const filters = url.readFilters(this.$route)

      const filtersWithoutMyFilter = filters.toSpliced(this.index, 1)
      const filterWithOnlyMyValue = createSimpleFilter(this.entityType, this.filterKey, this.value, this.isNegated)
      const queryFilters = (this.isNegated) ?
          filters :
          [...filtersWithoutMyFilter, filterWithOnlyMyValue]

      const count = await api.getResultsCount(this.entityType, queryFilters)
      this.myCount = count
    },
  },
  watch: {
    '$route.query.filter': {
      immediate: true,
      deep: true,
      handler(to, from) {
        this.getMyCount()
      }
    }
  }
}
</script>


<style scoped lang="scss">
.isNegated {
  text-decoration: line-through !important;
}
.group-by-table-row {
  cursor: pointer;
}
</style>