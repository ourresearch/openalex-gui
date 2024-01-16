<template>
  <tr @click="isSelected = !isSelected" class="group-by-table-row hover-color-1">
    <td class="pr-0" style="width: 1px; white-space: nowrap">
      <v-icon v-if="isSelected">mdi-checkbox-marked</v-icon>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </td>

    <td class="body-2">
      {{ row.displayValue }}
    </td>
    <td class="range body-2 text-right">
      {{ row.count | toPrecision }}
    </td>
  </tr>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {
    row: Object,
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isSelected: {
      get() {
        return url.isFilterOptionApplied(this.$route, this.entityType, this.filterKey, this.row.value)
      },
      set(to) {
        if (to) {
          url.upsertFilterOption(this.entityType, this.filterKey, this.row.value)
        }
        else {
          url.deleteFilterOption(this.entityType, this.filterKey, this.row.value)
        }
      }

    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">
.group-by-table-row {
  cursor:  pointer;
  &:hover {
    //background: $color-2;
  }
}

</style>