<template>
  <tr @click.prevent="$emit('click', value)" class="group-by-table-row hover-color-2">
    <td v-if="!hideCheckbox" class="pr-0" style="width: 1px; white-space: nowrap">
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </td>

    <td class="body-2" :class="{isNegated}">
      {{ displayValue }}
    </td>
    <td class="range body-2 text-right align-baseline">
      {{ myCount | toPrecision }}
    </td>
  </tr>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";

export default {
  name: "GroupByTableRow",
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
      foo: 42,
      myCount: this.count,
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
    isApplied() {
      if (this.$route.name === 'EntityPage') return false // there are no filters set on the entity page
      return url.isFilterOptionApplied(this.$route, this.entityType, this.filterKey, this.value)
    },
    isNegated() {
      return url.readIsFilterNegated(this.$route, this.entityType, this.index)
    },
    doesMyFilterHaveOtherOptions() {
      return url.readFilterOptions(this.$route, this.entityType, this.index)?.length > 1
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    filtersForCount() {

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
  created() {
  },
  mounted() {
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

  &:hover {
    //background: $color-2;
  }
}

</style>