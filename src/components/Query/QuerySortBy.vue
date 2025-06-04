<template>
  <span class="d-inline-flex">
    <v-select
        class="ml-2"
        v-model="selectedSortBy"
        :items="sortByOptions"
        placeholder="Sort by.."
        label="sort by"
        item-title="label"
        return-object
        hide-details
        rounded
        variant="filled"
        density="compact"
    />
  </span>
</template>

<script>

import {mapActions, mapGetters} from "vuex";
import {getConfigs} from "@/oaxConfigs";

export default {
  name: "QuerySortBy",
  components: {},
  props: {},
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters("search", [
      "query",
      "isQuerySingleRow",
      "querySubjectEntity",
    ]),
    columnIdOptions() {
      const myColumns = getConfigs()[this.querySubjectEntity].columns
      console.log("myColumns", myColumns)

      return Object.values(myColumns).filter(col => {
        return col.actions?.includes("sort")
      })
    },
    sortByOptions(){
      const ret = []
      this.columnIdOptions.forEach(col => {
        ["asc", "desc"].forEach(dir => {
          ret.push({
            column_id: col.id,
            direction: dir,
            label: `${col.displayName} ${dir}`
          })
        })
      })
      return ret
    },
    selectedSortBy: {
      get() {
        return this.query.sort_by
      },
      set({column_id, direction}) {
        this.setSortBy({column_id, direction})
      }
    },
  },

  methods: {
    ...mapActions("search", [
        "setSortBy",
    ]),
  },
}
</script>


<style scoped lang="scss">

</style>