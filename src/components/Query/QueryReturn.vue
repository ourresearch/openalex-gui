<template>
  <div>
    <v-list>
        <v-list-item
              v-for="option in options"
              :key="option.id"
              @click="clickListItem(option.id)"
          >
            <v-icon>{{ option.icon }}</v-icon>
            <v-list-item-title>{{ filters.pluralize(option.displayName, 1) }}</v-list-item-title>
          </v-list-item>

    </v-list>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import filters from "@/filters";

export default {
  name: "QueryReturn",
  components: {},
  props: {
    index: Number
  },
  data() {
    return {
      filters,
    }
  },
  computed: {
    ...mapGetters("search", [
      "query",
      "querySubjectEntityConfig",
      "querySubjectEntity",
    ]),
    options() {
      if (!this.querySubjectEntity) {
        return []
      }
      return Object.values(this.querySubjectEntityConfig.columns)
          .filter(col => {
            return col.actions?.includes("column")
          })
          .filter(col => {
            return !this.query.show_columns.includes(col.id)
          })
    },
  },
  methods: {
    ...mapMutations("search", [
      "toggleSummarize",
      "toggleSortByDirection",
    ]),
    ...mapActions("search", [
      "addReturnColumn",
      "createSearch",
    ]),
    clickListItem(id) {
      this.addReturnColumn(id)
      this.createSearch()
      this.$emit("close")
    }
  },
}
</script>


<style scoped lang="scss">

</style>