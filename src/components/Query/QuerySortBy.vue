<template>
  <span class="d-inline-flex">

    <v-autocomplete
        class="ml-2"
        v-model="selectedColumnId"
        :items="columnIdOptions"
        item-text="displayName"
        item-value="id"
        placeholder="Sort by"
        label="Sort by"
        hide-details
        clearable
        rounded
        filled
        dense
    />
    <v-select
        class="ml-2"
        v-model="query.sort_by.direction"
        :items="['asc', 'desc']"
        placeholder="Direction"
        label="direction"
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
    ]),
    columnIdOptions() {
      return Object.values(getConfigs()["works"].columns).filter(col => {
        return col.actions.includes("sort")
      })
    },
    selectedColumnId: {
      get() {
        return this.query.sort_by.column_id
      },
      set(value) {
        this.setSortByColumnId(value)
      }
    },
    iconName(){
      return this.query.sort_by.direction === "asc" ? "mdi-sort-ascending" : "mdi-sort-descending"
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
    ]),
    ...mapActions("search", [
        "setSortByColumnId"
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