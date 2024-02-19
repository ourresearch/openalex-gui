<template>
  <tr @click="clickRow" class="group-by-table-row hover-color-2">
    <td class="pr-0" style="width: 1px; white-space: nowrap">
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </td>

    <td class="body-2">
      <template v-if="isNegated" class="font-weight-bold">NOT</template>
      {{ myDisplayValue }}

      <!--      <span class="d-inline-flex align-baseline">-->
      <!--        <span v-if="isNegated" class="font-weight-bold">NOT </span>-->
      <!--        <span>{{ myDisplayValue }}</span>-->
      <!--      </span>-->

    </td>
    <td class="range body-2 text-right align-baseline">
      {{ myCount | toPrecision }}
    </td>
    <td class="pl-0 pr-1" style="width: 1px; white-space: nowrap">
      <v-btn small icon :disabled="isNegated" @click.stop="isNegated = true">
        <v-icon small>mdi-minus-circle-outline</v-icon>
      </v-btn>


    </td>
  </tr>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createSimpleFilter, filtersFromUrlStr, setStringIsNegated} from "@/filterConfigs";
import {api} from "@/api";

export default {
  name: "Template",
  components: {},
  props: {
    filterKey: String,
    value: String,
    displayValue: String || null,
    count: Number || null,
  },
  data() {
    return {
      isMenuOpen: false,
      foo: 42,
      myCount: this.count,
      myDisplayValue: this.displayValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    valueId() {
      return this.value.replace("!", "")
    },
    index(){
      return url.findFilterIndex(this.$route, this.entityType, this.filterKey, this.value)
    },
    isApplied: {
      get() {
        return url.isFilterOptionApplied(this.$route, this.entityType, this.filterKey, this.value)
      },
      set(to) {
        if (to) {
          // url.upsertFilterOption(this.entityType, this.filterKey, this.value)
          url.createFilter(this.entityType, this.filterKey, this.value)
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
            url.updateFilter(this.entityType, this.index, newValue) :
            url.createFilter(this.entityType, this.filterKey, newValue)

      }
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clickRow() {
          this.isApplied = !this.isApplied
      // return this.isNegated ?
      //     this.isNegated = false :
      //     this.isApplied = !this.isApplied
    },
    async getMyCount() {
      // if (this?.myCount) return
      const filters = url.readFilters(this.$route)
      const filtersWithoutMyFilter = filters.splice(this.index, 1)
      const myNewFilter = createSimpleFilter(this.entityType, this.filterKey, this.value, this.isNegated)
      const queryFilters = [...filters, myNewFilter]
      const count = await api.getResultsCount(this.entityType, queryFilters)
      this.myCount = count
    },
    async getMyDisplayValue() {
      if (this?.myDisplayValue) return // no need to get it it we've got it already
      this.myDisplayValue = await api.getFilterValueDisplayName(this.filterKey, this.valueId)
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
        this.getMyDisplayValue()
      }
    }
  }
}
</script>

<style scoped lang="scss">
.group-by-table-row {
  cursor: pointer;

  &:hover {
    //background: $color-2;
  }
}

</style>