<template>
  <div class="d-flex align-center flex-grow-1">
    <div v-if="filter.isRoot" class="text-h6 d-flex">
      Works filters ({{ query.filters.length - 1 }})
    </div>
    <div v-else>
              <span class="grey--text" v-if="filter.children.length === 0">
              <v-icon>mdi-menu-down</v-icon>
                Empty subquery:
              </span>
      <span class="">{{ filter.children.length }} </span>
      {{ "subfilter" | pluralize(filter.children.length) }}
    </div>
    <v-spacer></v-spacer>
    <v-chip
        @click.stop="toggleBranchFilterOperator(filter.id)"
        v-if="filter.children.length > 1"
        outlined
        class="mr-1"
    >
      <template v-if="filter.children.length === 2">
        {{ filter.operator === "and" ? "Both" : "Either" }}
      </template>
      <template v-else>
        {{ filter.operator === "and" ? "All" : "Any" }}
      </template>
    </v-chip>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {
  },
  props: {
    filter: Object,

  },
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
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),

    toggleBranchFilterOperator() {
      const newFilter = {
        ...this.filter,
        operator: this.filter.operator === "and" ? "or" : "and"
      }
      this.$emit("set", newFilter)
    },

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