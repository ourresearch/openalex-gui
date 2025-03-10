<template>
  <span class="d-inline-flex">
    <v-select
        class="ml-2"
        v-model="selectedSortBy"
        :items="sortByOptions"
        placeholder="Sort by.."
        label="sort by"
        item-text="label"
        return-object
        hide-details
        rounded
        filled
        dense
    />
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
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
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
    ]),
    ...mapActions("search", [
        "setSortBy",
    ]),
    ...mapActions("user", []),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>