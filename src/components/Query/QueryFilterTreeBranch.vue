<template>
  <div class="d-flex align-center flex-grow-1">
    <div v-if="filter.isRoot" class="text-h6 d-flex">
      Works filters
    </div>
    <div v-else>
      <span class="grey--text" v-if="filter.children.length === 1">
        [Empty subquery]
      </span>
      <span v-else class="">
        Subquery:
      </span>
<!--      {{ "subfilter" | pluralize(filter.children.length) }}-->
    </div>
    <v-spacer></v-spacer>
    <v-chip

        @click.stop="toggleBranchFilterOperator"
        v-if="filter.children.length > 2 && !filter.isRoot"
        outlined
        class="mr-1"
    >
        {{ filter.operator }}
    </v-chip>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
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
      console.log("toggleBranchFilterOperator", this.filter)
      this.$emit("setOperator", {
        id: this.filter.id,
        operator: this.filter.operator === "and" ? "or" : "and"
      }
    )
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